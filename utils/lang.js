const langs = require('../langStore');

const dict = {
    ID: {
        noVoice: 'Hmph! Kamu sendiri tidak ada di voice channel, beraninya memanggil Maou-sama! 💢',
        emptyQuery: 'Hah? Kamu mau Maou-sama memutar angin? Berikan judul atau URL lagunya! 😤',
        queueEmpty: 'Fufufu~ Antrean lagu sudah habis! Keheningan kembali menguasai. 🤫✨',
        playing: '🎵 Fufufu~ Maou-sama mulai memutar:\n**{title}** ✨',
        playError: 'Ugh! Sihir pemutarnya gagal untuk lagu **{title}**! 💢',
        notFound: 'Ugh! Sihir pencarianku tidak menemukan lagu itu! 💢',
        added: 'Fufufu~ Lagu **{title}** telah ditambahkan ke antrean sihirku! 📜✨',
        searchError: 'Ugh! Ada gangguan sihir saat mencari lagu itu! 💢',
        radioStart: 'Fufufu~ Maou-sama telah menyetel frekuensi ke listen.moe JPOP! Dengarkan baik-baik! 📻✨',
        notOwner: 'Hmph! Kamu bukan pemanggil asliku! Hanya <@{ownerId}> yang bisa memerintahku! 💢',
        stopped: 'Fufufu~ Musik dihentikan dan antrean dibersihkan! Keheningan kembali. 🤫✨',
        left: 'Hmph! Maou-sama pergi dulu! Jangan rindu ya~ 🦇✨',
        paused: 'Fufufu~ Waktu berhenti untuk lagu ini! ⏸️✨',
        resumed: 'Fufufu~ Waktu kembali berjalan! Lanjutkan lagunya! ▶️✨',
        skipped: 'Fufufu~ Lagu dilewati! Mari dengarkan yang berikutnya! ⏭️✨',
        loopOn: 'Fufufu~ Kutukan pengulangan diaktifkan! Lagu ini akan terus berputar! 🔁✨',
        loopOff: 'Fufufu~ Kutukan pengulangan dilepas! Waktu kembali berjalan normal. ➡️✨',
        queueList: '📜 **Antrean Sihir Maou-sama** 📜\n\n',
        queueEmptyList: 'Hmph! Antreannya kosong melompong! 🕸️',
        moved: 'Fufufu~ Maou-sama berpindah ke channel barumu! 🦇✨',
        ownerMoved: 'Fufufu~ Hak kepemilikan dipindahkan ke <@{newOwnerId}>! Jangan kecewakan Maou-sama! 👑✨',
        ownerMoveError: 'Hmph! Tag orang yang ingin kamu jadikan pemilik baru! 💢',
        autoOn: 'Fufufu~ Sihir rekomendasi otomatis diaktifkan! Maou-sama akan mencarikan lagu selanjutnya! 🔮✨',
        autoOff: 'Fufufu~ Sihir rekomendasi otomatis dimatikan! 🛑✨',
        volumeSet: 'Fufufu~ Volume diatur ke **{volume}%**! 🔊✨',
        volumeInvalid: 'Hmph! Volume harus antara 1 sampai 100! 💢' {
        noVoice: 'Hmph! You are not even in a voice channel, how dare you summon Maou-sama! 💢',
        emptyQuery: 'Hah? Do you want Maou-sama to play the wind? Give me a title or URL! 😤',
        queueEmpty: 'Fufufu~ The queue is empty! Silence reigns once more. 🤫✨',
        playing: '🎵 Fufufu~ Maou-sama is now playing:\n**{title}** ✨',
        playError: 'Ugh! The playback magic failed for **{title}**! 💢',
        notFound: 'Ugh! My search magic couldn\'t find that song! 💢',
        added: 'Fufufu~ **{title}** has been added to my magical queue! 📜✨',
        searchError: 'Ugh! There was a magical interference while searching! 💢',
        radioStart: 'Fufufu~ Maou-sama has tuned the frequency to listen.moe JPOP! Listen closely! 📻✨',
        notOwner: 'Hmph! You are not my original summoner! Only <@{ownerId}> can command me! 💢',
        stopped: 'Fufufu~ Music stopped and queue cleared! Silence returns. 🤫✨',
        left: 'Hmph! Maou-sama is leaving! Don\'t miss me too much~ 🦇✨',
        paused: 'Fufufu~ Time has stopped for this song! ⏸️✨',
        resumed: 'Fufufu~ Time flows once more! Resume the song! ▶️✨',
        skipped: 'Fufufu~ Song skipped! Let\'s hear the next one! ⏭️✨',
        loopOn: 'Fufufu~ The curse of repetition is active! This song will play forever! 🔁✨',
        loopOff: 'Fufufu~ The curse of repetition is lifted! Time flows normally again. ➡️✨',
        queueList: '📜 **Maou-sama\'s Magical Queue** 📜\n\n',
        queueEmptyList: 'Hmph! The queue is completely empty! 🕸️',
        moved: 'Fufufu~ Maou-sama has moved to your new channel! 🦇✨',
        ownerMoved: 'Fufufu~ Ownership transferred to <@{newOwnerId}>! Don\'t disappoint Maou-sama! 👑✨',
        ownerMoveError: 'Hmph! Tag the person you want to make the new owner! 💢',
        autoOn: 'Fufufu~ Auto-recommendation magic activated! Maou-sama will find the next song! 🔮✨',
        autoOff: 'Fufufu~ Auto-recommendation magic deactivated! 🛑✨',
        volumeSet: 'Fufufu~ Volume set to **{volume}%**! 🔊✨',
        volumeInvalid: 'Hmph! Volume must be between 1 and 100! 💢' {
        noVoice: 'ふん！自分はボイスチャンネルにいないのに、魔王様を呼び出すなんて！ 💢',
        emptyQuery: 'はあ？魔王様に風を再生しろと？タイトルかURLを教えなさい！ 😤',
        queueEmpty: 'ふふふ〜 キューが空になったわ！再び静寂が支配する。 🤫✨',
        playing: '🎵 ふふふ〜 魔王様が再生を開始するわ：\n**{title}** ✨',
        playError: 'うっ！**{title}**の再生魔法が失敗したわ！ 💢',
        notFound: 'うっ！探索魔法がその曲を見つけられなかったわ！ 💢',
        added: 'ふふふ〜 **{title}**を魔法のキューに追加したわ！ 📜✨',
        searchError: 'うっ！探索中に魔法の干渉があったわ！ 💢',
        radioStart: 'ふふふ〜 魔王様がlisten.moe JPOPに周波数を合わせたわ！よく聞きなさい！ 📻✨',
        notOwner: 'ふん！あなたは私の召喚者じゃないわ！<@{ownerId}>だけが私に命令できるの！ 💢',
        stopped: 'ふふふ〜 音楽を止めてキューをクリアしたわ！静寂が戻る。 🤫✨',
        left: 'ふん！魔王様は帰るわ！寂しがらないでね〜 🦇✨',
        paused: 'ふふふ〜 この曲の時間を止めたわ！ ⏸️✨',
        resumed: 'ふふふ〜 時間が再び動き出す！曲を再開するわ！ ▶️✨',
        skipped: 'ふふふ〜 曲をスキップしたわ！次を聞きましょう！ ⏭️✨',
        loopOn: 'ふふふ〜 反復の呪いをかけたわ！この曲は永遠に続く！ 🔁✨',
        loopOff: 'ふふふ〜 反復の呪いを解いたわ！時間は再び正常に流れる。 ➡️✨',
        queueList: '📜 **魔王様の魔法のキュー** 📜\n\n',
        queueEmptyList: 'ふん！キューはすっからかんよ！ 🕸️',
        moved: 'ふふふ〜 魔王様が新しいチャンネルに移動したわ！ 🦇✨',
        ownerMoved: 'ふふふ〜 所有権を<@{newOwnerId}>に譲渡したわ！魔王様を失望させないでね！ 👑✨',
        ownerMoveError: 'ふん！新しい所有者にしたい人をタグ付けしなさい！ 💢',
        autoOn: 'ふふふ〜 自動おすすめ魔法を有効にしたわ！魔王様が次の曲を探してあげる！ 🔮✨',
        autoOff: 'ふふふ〜 自動おすすめ魔法を無効にしたわ！ 🛑✨',
        volumeSet: 'ふふふ〜 ボリュームを**{volume}%**に設定したわ！ 🔊✨',
        volumeInvalid: 'ふん！ボリュームは1から100の間でなければならないわ！ 💢'

function getMsg(guildId, key, params = {}) {
    const lang = langs.get(guildId) || 'ID';
    let msg = dict[lang][key] || dict['ID'][key];
    for (const [k, v] of Object.entries(params)) {
        msg = msg.replace(`{${k}}`, v);
    }
    return msg;
}

module.exports = { getMsg };
