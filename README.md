<h1>Maou-bot</h1>

<sub><b>A simple and lightweight Discord music bot</b><br>
Featuring YouTube/SoundCloud playback, 24/7 JPOP radio, and a web dashboard.</sub>

<br><br>

<b>Features</b>
-  Play music from YouTube and SoundCloud
-  24/7 JPOP Radio streaming via listen.moe
-  Multi-language support (English, Indonesian, Japanese)
-  Built-in web dashboard for bot status
-  Session ownership system

<br>

<b>Prerequisites</b>
- Node.js (v18 or higher)
- FFmpeg (required for audio playback)

<br>

<b>Installation</b>

1. Clone the repository:
```bash
git clone https://github.com/kumoruBaka/Maou-bot.git
cd Maou-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file and add your token:
```env
TOKEN=your_discord_bot_token_here
```

<br>

<b>Usage</b>

Start the bot:
```bash
npm start
```
The web dashboard will be available at `http://localhost:3212`.

<br>

<b>Commands</b>

Prefix: `mao.`

- `mao.play <url/title>` - Play a song from YouTube or SoundCloud
- `mao.stream` - Play listen.moe JPOP radio
- `mao.stop` - Stop playback and clear queue
- `mao.skip` - Skip the current song
- `mao.pause` / `mao.resume` - Pause or resume playback
- `mao.loop` - Toggle loop for the current song
- `mao.queue` - Show the current music queue
- `mao.lang <ID/EN/JP>` - Change bot language
- `mao.help` - Show all available commands

<br>

<b>License</b>

[MIT](LICENSE)
