const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const langStore = require('../langStore');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const lang = langStore.get(r.guildId) || 'ID';

    let title, desc, f1, f2, f3;
    if (lang === 'EN') {
        title = '📜 Maou-sama\'s Grimoire';
        desc = 'Fufufu~ Here is the list of commands you can use, my servant! ✨';
        f1 = '> `mao.leave` / `/leave` - Send Maou-sama back to the castle\n> `mao.stream [fallback]` / `/stream` - Play JPOP radio\n> `mao.stop` / `/stop` - Stop music magic\n> `mao.info` / `/info` - See current song\n> `mao.info.auto` / `/infoauto` - Toggle auto-info\n> `mao.lang <ID/EN/JP>` / `/lang` - Change language';
        f2 = '> `mao.play <url/title>` / `/play` - Play song from YT/SoundCloud\n> `mao.queue` / `/queue` - See queue\n> `mao.skip` / `/skip` - Skip song\n> `mao.pause` / `/pause` - Pause song\n> `mao.resume` / `/resume` - Resume song\n> `mao.loop` / `/loop` - Loop current song\n> `mao.auto [genre]` / `/auto` - Auto-play recommendations';
        f3 = '> `mao.move` / `/move` - Move Maou-sama to your channel\n> `mao.ownership.move @user` / `/ownership-move` - Transfer contract';
    } else if (lang === 'JP') {
        title = '📜 魔王様の魔導書';
        desc = 'ふふふ〜 これが使えるコマンドのリストよ、我が下僕！ ✨';
        f1 = '> `mao.leave` / `/leave` - 魔王様を城に帰す\n> `mao.stream [fallback]` / `/stream` - JPOPラジオを再生\n> `mao.stop` / `/stop` - 音楽魔法を停止\n> `mao.info` / `/info` - 現在の曲を確認\n> `mao.info.auto` / `/infoauto` - 自動情報表示を切り替え\n> `mao.lang <ID/EN/JP>` / `/lang` - 言語を変更';
        f2 = '> `mao.play <url/title>` / `/play` - YT/SoundCloudから曲を再生\n> `mao.queue` / `/queue` - キューを確認\n> `mao.skip` / `/skip` - 曲をスキップ\n> `mao.pause` / `/pause` - 曲を一時停止\n> `mao.resume` / `/resume` - 曲を再開\n> `mao.loop` / `/loop` - 現在の曲をループ\n> `mao.auto [genre]` / `/auto` - 自動おすすめ';
        f3 = '> `mao.move` / `/move` - 魔王様をあなたのチャンネルに移動\n> `mao.ownership.move @user` / `/ownership-move` - 契約を譲渡';
    } else {
        title = '📜 Buku Sihir Maou-sama';
        desc = 'Fufufu~ Ini daftar perintah yang bisa kamu gunakan, pelayanku! ✨';
        f1 = '> `mao.leave` / `/leave` - Suruh Maou-sama kembali ke kastil\n> `mao.stream [fallback]` / `/stream` - Putar radio JPOP\n> `mao.stop` / `/stop` - Hentikan sihir musik\n> `mao.info` / `/info` - Lihat lagu yang sedang diputar\n> `mao.info.auto` / `/infoauto` - Toggle auto-info\n> `mao.lang <ID/EN/JP>` / `/lang` - Ubah bahasa';
        f2 = '> `mao.play <url/judul>` / `/play` - Putar lagu dari YT/SoundCloud\n> `mao.queue` / `/queue` - Lihat antrean lagu\n> `mao.skip` / `/skip` - Lewati lagu saat ini\n> `mao.pause` / `/pause` - Jeda lagu\n> `mao.resume` / `/resume` - Lanjutkan lagu\n> `mao.loop` / `/loop` - Ulangi lagu saat ini\n> `mao.auto [genre]` / `/auto` - Auto-play rekomendasi';
        f3 = '> `mao.move` / `/move` - Pindahkan Maou-sama ke channelmu\n> `mao.ownership.move @user` / `/ownership-move` - Pindah kontrak ke pelayan lain';
    }

    const embed = new EmbedBuilder()
        .setColor('#ff0055')
        .setTitle(title)
        .setDescription(desc)
        .addFields(
            { name: '🎵 Musik & Radio', value: f1 },
            { name: '▶️ Multimedia', value: f2 },
            { name: '👑 Kontrak & Master', value: f3 }
        )
        .setFooter({ text: 'Diciptakan oleh kunomaru (lynlll_) 🦇' })
        .setTimestamp();

    r.reply({ embeds: [embed] });
}

module.exports = {
    name: 'help',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Tampilkan semua perintah Maou-sama'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
