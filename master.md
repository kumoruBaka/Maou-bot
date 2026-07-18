# Master Blueprint — Maou-sama Music Bot
> Spec-Driven Development Reference Document  
> Dibuat: Juli 2026 | Versi: 1.0.0

---

## 1. Gambaran Umum Proyek

**Nama:** `maou-sama`  
**Tipe:** Discord Music Bot (prefix-based, Node.js)  
**Karakter:** Maou-sama — bot dengan persona villain/tsundere bertema anime  
**Prefix:** `mao.` (saat ini hardcode ke `test.` di messageCreate.js)  
**Bahasa Bot:** Trilingual — Indonesia (default), English, Japanese  

### Tujuan Utama
Bot Discord untuk memutar musik dari YouTube, SoundCloud, dan radio live stream [listen.moe](https://listen.moe) (JPOP), dengan sistem antrian per-guild, kontrol kepemilikan sesi, dan auto-play berbasis rekomendasi YouTube.

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                     index.js                        │
│  (Entry point: client, command loader, event loader) │
└────────┬────────────────────────┬───────────────────┘
         │                        │
         ▼                        ▼
  events/                   commands/
  ├── ready.js              ├── play.js        ← Core Engine
  └── messageCreate.js      ├── stream.js
         │                  ├── auto.js
         │                  ├── skip/stop/pause/resume/loop/queue
         │                  ├── move/ownership.move
         │                  ├── info/info.auto
         │                  ├── lang/help/leave
         │
         ▼
  Shared Modules
  ├── playerStore.js         ← In-memory guild sessions (Map)
  ├── langStore.js           ← In-memory guild lang preferences (Map)
  ├── listenMoeWs.js         ← WebSocket client ke listen.moe gateway
  └── utils/
      ├── lang.js            ← i18n dictionary + getMsg()
      ├── ytScraper.js       ← YouTube → MP3 URL resolver (3rd-party API)
      └── ytAuto.js          ← YouTube Data API v3 auto-recommendation
```

### Alur Data Utama — Command `play`

```
User: mao.play <query>
        │
        ▼
messageCreate.js  →  parse prefix + command name
        │
        ▼
commands/play.js  →  resolve query
    ├── SoundCloud URL   → api.siputzx.my.id/api/d/soundcloud
    ├── YouTube URL      → ytScraper.scrapeYt(videoId)
    ├── Other URL        → play-dl.video_info()
    └── Text search      → play-dl.search() → ytScraper.scrapeYt()
        │
        ▼
     trackInfo { title, url, thumbnail, isScraped }
        │
        ▼
  session.queue.push(trackInfo)
        │
        ▼
  playNext() → createAudioResource → player.play()
        │
        ▼
  AudioPlayerStatus.Idle → playNext() (loop / autoPlay / next)
```

---

## 3. State Model Per-Guild

Setiap guild memiliki satu session yang disimpan di `playerStore` (Map):

```js
{
  player:       AudioPlayer,   // @discordjs/voice player instance
  ownerId:      string,        // Discord user ID — pemegang kontrak
  queue:        TrackInfo[],   // Antrian lagu
  loop:         boolean,       // Ulangi lagu saat ini
  autoPlay:     boolean,       // Auto-recommendation via YouTube API
  autoGenre:    string,        // Genre untuk fallback auto (default: 'j-pop')
  currentTrack: TrackInfo,     // Lagu yang sedang diputar
  isRadio:      boolean        // Mode radio listen.moe
}
```

**TrackInfo:**
```js
{
  title:     string,
  url:       string,   // Direct audio URL atau YouTube stream URL
  thumbnail: string,
  isScraped: boolean   // true = direct MP3 URL, false = play-dl stream
}
```


---

## 4. Daftar Lengkap Commands

| Command | File | Deskripsi | Owner-Only |
|---|---|---|---|
| `play <query/url>` | play.js | Putar YT/SoundCloud/URL; auto-join VC | ❌ (semua bisa tambah queue) |
| `stream [fallback]` | stream.js | Putar radio listen.moe JPOP live | ❌ |
| `auto [genre]` | auto.js | Toggle auto-play rekomendasi YT | ❌ |
| `skip` | skip.js | Skip lagu, picu `Idle` → `playNext()` | ✅ |
| `stop` | stop.js | Stop player, hapus session | ✅ |
| `pause` | pause.js | Pause player | ✅ |
| `resume` | resume.js | Unpause player | ✅ |
| `loop` | loop.js | Toggle loop lagu saat ini | ✅ |
| `queue` | queue.js | Tampilkan antrian (max 10 + sisa) | ❌ |
| `leave` | leave.js | Disconnect bot dari VC, hapus session | ✅ |
| `move` | move.js | Pindah bot ke VC user | ✅ |
| `ownership.move @user` | ownership.move.js | Transfer ownerId ke user lain | ✅ |
| `info` | info.js | Info lagu radio listen.moe saat ini | ❌ |
| `info.auto` | info.auto.js | Toggle auto-broadcast per-channel | ❌ |
| `lang <ID/EN/JP>` | lang.js | Ganti bahasa respons per-guild | ❌ |
| `help` | help.js | Embed daftar semua command | ❌ |

### Aturan Kepemilikan (Ownership)
- **`ownerId`** ditetapkan saat session pertama dibuat (user yang pertama `play` atau `stream`).
- Semua user boleh menambah lagu ke antrian.
- Skip, stop, pause, resume, loop, leave, move **hanya bisa dilakukan oleh owner**.
- `ownership.move @user` memindahkan hak ownership tanpa mengganggu sesi.

---

## 5. Modul Inti

### 5.1 `listenMoeWs.js` — Radio WebSocket
- Koneksi ke `wss://listen.moe/gateway_v2`
- Event `op:1 / TRACK_UPDATE` → update `currentSong`, update bot presence
- Auto-reconnect 5 detik bila koneksi putus
- `autoInfoChannels` (Set) — channel yang aktif menerima broadcast now-playing
- Export: `getCurrentSong()`, `setClient(client)`, `toggleAutoInfo(channelId)`

### 5.2 `utils/ytScraper.js` — YouTube Audio Resolver
- Menggunakan API `epsilon.epsiloncloud.org` (3rd-party converter)
- Alur: auth → init → convert (dengan redirect loop) → progress polling → downloadURL
- Return: `{ url, title, thumbnail }`
- **Catatan:** Bergantung pada layanan 3rd-party eksternal, rawan perubahan/downtime

### 5.3 `utils/ytAuto.js` — YouTube Recommendation
- Menggunakan YouTube Data API v3 (`googleapis`)
- Prioritas: `relatedToVideoId` dari lagu saat ini → fallback ke pencarian genre
- Filter: skip live stream, durasi > 10 menit, skip YouTube Shorts (≤ 60 detik)
- Membutuhkan env var: `YOUTUBE_API_KEY`

### 5.4 `utils/lang.js` — Internasionalisasi
- Dictionary statis 3 bahasa: `ID`, `EN`, `JP`
- 27 message keys per bahasa
- Template variable: `{title}`, `{ownerId}`, `{newOwnerId}`
- `getMsg(guildId, key, params)` → string lokalisasi


---

## 6. Dependensi

| Package | Versi | Fungsi |
|---|---|---|
| `discord.js` | ^14.26.5 | Discord API client |
| `@discordjs/voice` | ^0.19.2 | Voice channel & audio playback |
| `play-dl` | ^1.9.7 | YouTube stream & search |
| `googleapis` | ^173.0.0 | YouTube Data API v3 (auto-recommendation) |
| `node-fetch` | ^2.7.0 | HTTP requests (scraper, SoundCloud, webhook) |
| `ws` | ^8.21.1 | WebSocket client untuk listen.moe |
| `dotenv` | ^16.4.5 | Environment variable loader |
| `opusscript` | ^0.0.8 | Opus audio codec (fallback) |
| `libsodium-wrappers` | ^0.7.13 | Enkripsi voice (sodium) |
| `sodium-native` | ^5.1.0 | Native sodium binding |

### Environment Variables

| Variabel | Wajib | Keterangan |
|---|---|---|
| `TOKEN` | ✅ | Discord bot token |
| `YOUTUBE_API_KEY` | ✅ (untuk auto) | API key Google Cloud / YouTube Data API v3 |

> `.env.example` saat ini hanya mendokumentasikan `TOKEN`. `YOUTUBE_API_KEY` perlu ditambahkan.

---

## 7. Event System

| Event | File | Trigger |
|---|---|---|
| `clientReady` (once) | events/ready.js | Bot online — set activity ke "listen.moe" |
| `messageCreate` | events/messageCreate.js | Setiap pesan — parse prefix `test.`, dispatch command |
| `guildCreate` | index.js | Bot bergabung ke server baru → kirim webhook embed |
| `guildDelete` | index.js | Bot dikeluarkan dari server → kirim webhook embed |
| `AudioPlayerStatus.Idle` | play.js / auto.js | Player selesai → panggil `playNext()` |
| `player.error` | play.js / auto.js / stream.js | Error audio → skip ke lagu berikutnya |

### Crash Handler
`index.js` menangani `uncaughtException`, `unhandledRejection`, dan `SIGINT`:
- Destroy semua voice connections aktif
- Exit process

---

## 8. Known Issues & Technical Debt

### 🔴 Kritis
1. **Prefix hardcode `test.`** di `messageCreate.js` — seharusnya `mao.` per dokumentasi help.js. Perlu diseragamkan atau dipindah ke `.env`.
2. **Webhook URL exposed** di `index.js` — webhook Discord hardcode di source code, harus dipindah ke `.env`.
3. **`YOUTUBE_API_KEY` tidak terdokumentasi** di `.env.example` — silent failure bila key tidak ada.

### 🟡 Medium
4. **`autoInfoChannels` tidak persisten** — di-reset setiap bot restart, semua user harus toggle ulang.
5. **`langStore` tidak persisten** — preferensi bahasa per-guild hilang saat restart.
6. **`playerStore` in-memory only** — queue hilang saat bot restart.
7. ~~**`ytScraper.js` bergantung pada 3rd-party** (`epsilon.epsiloncloud.org`) — tidak ada fallback bila API ini down.~~ ✅ *Diselesaikan SPEC-04: retry 3x + fallback ke play-dl.*
8. ~~**`relatedToVideoId`** di YouTube API v3 sudah deprecated — `ytAuto.js` perlu migrasi ke endpoint lain.~~ ✅ *Diselesaikan SPEC-04: migrasi ke pencarian berbasis judul/channel.*

### 🟢 Minor
9. **`info.auto.js` masih hardcode bahasa Indonesia** — tidak menggunakan sistem `getMsg()`.
10. **`stream.js`** memiliki debug `stateChange` listener yang tersisa di production.
11. **`ownership.move` command name** mengandung titik — perlu validasi cara parsing di `messageCreate.js`.
12. **`auto.js`** menduplikasi setup player dari `play.js` — bisa di-extract ke helper.


---

## 9. Spec Development Roadmap

Berikut adalah daftar fitur/perbaikan yang dapat dikerjakan dengan pendekatan Spec-Driven Development, diurutkan berdasarkan prioritas.

---

### SPEC-01 — Perbaikan Konfigurasi & Keamanan
**Status:** `done` ✅  
**Prioritas:** Kritis  

**Requirements:**
- [x] Prefix bot dipindahkan ke `.env` sebagai `PREFIX=mao.`
- [x] Webhook URL dipindahkan ke `.env` sebagai `WEBHOOK_URL`
- [x] `.env.example` diperbarui dengan semua variabel yang dibutuhkan
- [x] `messageCreate.js` membaca prefix dari `process.env.PREFIX`

**Acceptance Criteria:**
- Bot berjalan dengan prefix `mao.` tanpa mengubah source code
- Tidak ada kredensial/URL sensitif di source code
- `.env.example` mendokumentasikan semua variabel (TOKEN, YOUTUBE_API_KEY, PREFIX, WEBHOOK_URL)

---

### SPEC-02 — Persistence Layer
**Status:** `done` ✅  
**Prioritas:** Tinggi  

**Requirements:**
- [x] Preferensi bahasa per-guild persisten (survive restart) menggunakan file JSON atau SQLite
- [x] `autoInfoChannels` persisten per-guild
- [ ] Opsional: simpan queue saat shutdown graceful

**Design:**
```
storage/
├── guilds.json    { guildId: { lang: "ID", autoInfoChannels: [] } }
```
atau gunakan `better-sqlite3` untuk relational storage.

**Acceptance Criteria:**
- Preferensi bahasa tetap ada setelah bot restart
- Auto-info channel tetap aktif setelah restart

---

### SPEC-03 — Refactor Command Handler
**Status:** `done` ✅  
**Prioritas:** Medium  

**Requirements:**
- [x] Extract `createPlayerSession()` helper dari `play.js` dan `auto.js` (DRY)
- [x] Command name dengan titik (`.`) dihandle dengan benar di parser
- [x] Tambah validasi: user harus berada di VC yang sama dengan bot untuk command owner

**Design:**
```js
// utils/session.js
function createPlayerSession(connection, message) { ... }
module.exports = { createPlayerSession };
```

---

### SPEC-04 — Error Handling & Fallback Audio
**Status:** `✅ selesai` — Juli 2026  
**Prioritas:** Medium  

**Requirements:**
- [x] `ytScraper.js` memiliki retry mechanism (max 3x) sebelum throw error
- [x] Fallback ke `play-dl` bila `ytScraper` gagal
- [x] `ytAuto.js` handle deprecated `relatedToVideoId` — migrasi ke pencarian berbasis judul/artist
- [x] Error message lebih informatif (jenis error, bukan hanya pesan generik)

**Acceptance Criteria:**
- Bot tidak crash bila `ytScraper` gagal; mencoba fallback dan lapor ke channel ✅
- `ytAuto.js` tetap berfungsi meski `relatedToVideoId` tidak didukung ✅

**Perubahan:**
- `utils/ytScraper.js` — pisah `scrapeYtOnce()` + `scrapeYt()` dengan retry 3x (backoff 1.5s/3s) + `scrapeYtFallback()` via play-dl. Error message sertakan HTTP status & API error code.
- `utils/ytAuto.js` — hapus `relatedToVideoId`. Strategi baru: (1) bangun query dari judul+channel video saat ini (noise filtering), (2) fallback ke genre. Guard `YOUTUBE_API_KEY` tidak ada.
- `commands/play.js` — pisah `resolveQuery()` ke fungsi tersendiri, semua error path sertakan `error.message` di reply user, `isScraped` mengikuti return value scraper (dinamis saat fallback), simpan `originalUrl` di TrackInfo untuk keperluan rekomendasi auto-play.

---

### SPEC-05 — Fitur Tambahan: Volume Control
**Status:** `done` ✅  
**Prioritas:** Rendah  

**Requirements:**
- [x] Command `mao.volume <1-100>` — atur volume output audio
- [x] Simpan volume per-session di playerStore
- [x] Hanya owner yang bisa mengubah volume

**Technical Note:**
`@discordjs/voice` memerlukan `InlineVolume` pada `createAudioResource`:
```js
createAudioResource(stream, { inlineVolume: true })
resource.volume.setVolume(0.5); // 50%
```

---

### SPEC-06 — Fitur Tambahan: Playlist YouTube
**Status:** `done` ✅  
**Prioritas:** Rendah  

**Requirements:**
- [x] `mao.play <youtube-playlist-url>` menambah semua lagu ke antrian
- [x] Batasi maksimal 50 lagu per playlist untuk mencegah abuse
- [x] Tampilkan konfirmasi: "X lagu dari playlist Y ditambahkan"

**Technical Note:**
`play-dl` mendukung `playlist_info()` untuk YouTube playlist.

---

### SPEC-07 — Slash Commands Migration
**Status:** `pending`  
**Prioritas:** Rendah (Long-term)  

> ⚠️ **Keputusan Arsitektur:** Prefix commands `mao.` **tetap dipertahankan** sebagai sistem utama dan tidak dihapus. Slash commands ditambahkan sebagai lapisan tambahan (dual-mode), bukan pengganti.

**Requirements:**
- [ ] Tambah slash commands sebagai alternatif di samping prefix `mao.` (bukan menggantikan)
- [ ] Daftarkan commands via `REST` API Discord saat bot startup
- [ ] Prefix `mao.` tetap berfungsi penuh setelah migrasi
- [ ] Slash commands dan prefix commands berbagi logika yang sama (tidak duplikasi)

**Technical Note:**
- Gunakan `discord.js` `SlashCommandBuilder` dan `interactionCreate` event
- Pisahkan logika bisnis ke fungsi terpisah yang bisa dipanggil dari keduanya
- Contoh pola dual-mode:
```js
// commands/play.js
async function executeLogic(guildId, query, channel, member) { ... }

// Prefix handler
execute(message, args) { executeLogic(message.guild.id, args.join(' '), message.channel, message.member); }

// Slash handler  
executeSlash(interaction) { executeLogic(interaction.guildId, interaction.options.getString('query'), interaction.channel, interaction.member); }
```


---

## 10. Struktur File Lengkap

```
music bot/
├── .env                    # Variabel environment (tidak di-commit)
├── .env.example            # Template env vars
├── .gitignore
├── index.js                # Entry point: client setup, command/event loader
├── playerStore.js          # Singleton Map: guildId → session
├── langStore.js            # Singleton Map: guildId → lang string
├── listenMoeWs.js          # listen.moe WebSocket client
├── package.json
│
├── commands/
│   ├── auto.js             # Toggle auto-play rekomendasi YT
│   ├── help.js             # Embed daftar command (trilingual)
│   ├── info.js             # Info lagu radio saat ini
│   ├── info.auto.js        # Toggle auto-broadcast per-channel
│   ├── lang.js             # Ganti bahasa per-guild
│   ├── leave.js            # Disconnect dari VC
│   ├── loop.js             # Toggle loop
│   ├── move.js             # Pindah ke VC user
│   ├── ownership.move.js   # Transfer ownership
│   ├── pause.js            # Pause player
│   ├── play.js             # ← Core: queue + playback engine
│   ├── queue.js            # Tampilkan antrian
│   ├── resume.js           # Unpause player
│   ├── skip.js             # Skip lagu
│   ├── stop.js             # Stop + clear session
│   └── stream.js           # Radio listen.moe
│
├── events/
│   ├── messageCreate.js    # Prefix command dispatcher
│   └── ready.js            # Bot online handler
│
└── utils/
    ├── lang.js             # i18n dictionary + getMsg()
    ├── ytAuto.js           # YouTube Data API v3 auto-recommendation
    └── ytScraper.js        # YouTube → MP3 URL resolver
```

---

## 11. Panduan Kontribusi & Dev Workflow

### Setup Local
```bash
# 1. Clone & install
npm install

# 2. Buat file .env
cp .env.example .env
# Edit .env: isi TOKEN dan YOUTUBE_API_KEY

# 3. Jalankan bot
npm run dev       # dengan nodemon (auto-restart)
npm start         # production
```

### Menambah Command Baru
1. Buat file `commands/<nama>.js`
2. Export objek dengan `{ name, execute(message, args) }`
3. `name` harus sesuai dengan kata setelah prefix (contoh: `name: 'play'` → `mao.play`)
4. Command otomatis di-load oleh `index.js` — tidak perlu registrasi manual
5. Gunakan `getMsg(guildId, key)` untuk semua pesan user-facing
6. Untuk pesan baru, tambahkan key di ketiga bahasa pada `utils/lang.js`

### Menambah Bahasa Baru
1. Tambah objek bahasa baru di `utils/lang.js` (contoh: `KR: { ... }`)
2. Update validasi di `commands/lang.js`: tambahkan kode bahasa ke array `['ID', 'EN', 'JP', 'KR']`
3. Update `commands/help.js` untuk menampilkan teks dalam bahasa baru

---

## 12. Referensi & Sumber

| Sumber | URL |
|---|---|
| discord.js v14 | https://discord.js.org |
| @discordjs/voice | https://discord.js.org/docs/packages/voice/main |
| play-dl | https://github.com/play-dl/play-dl |
| YouTube Data API v3 | https://developers.google.com/youtube/v3 |
| listen.moe | https://listen.moe |
| googleapis npm | https://www.npmjs.com/package/googleapis |

---

*Dokumen ini dihasilkan dari analisis source code penuh proyek Maou-sama Music Bot.*  
*Penulis: Kiro (AI Dev Assistant) — Juli 2026*
