const { EmbedBuilder } = require('discord.js');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'help',
    execute(message, args, client) {
        const lang = require('../langStore').get(message.guild.id) || 'ID';
        
        let title, desc, f1, f2, f3;
        if (lang === 'EN') {
            title = '📜 Maou-sama\'s Grimoire';
            desc = 'Fufufu~ Here is the list of commands you can use, my servant! ✨';
            f1 = '> `mao.leave` - Send Maou-sama back to the castle\n> `mao.stream [fallback]` - Play JPOP radio\n> `mao.stop` - Stop music magic\n> `mao.info` - See current song\n> `mao.info.auto` - Toggle auto-info\n> `mao.lang <ID/EN/JP>` - Change language';
            f2 = '> `mao.play <url/title>` - Play song from YT/SoundCloud\n> `mao.queue` - See queue\n> `mao.skip` - Skip song\n> `mao.pause` - Pause song\n> `mao.resume` - Resume song\n> `mao.loop` - Loop current song';
            f3 = '> `mao.move` - Move Maou-sama to your channel\n> `mao.ownership.move @user` - Transfer contract';
        } else if (lang === 'JP') {
            title = '📜 魔王様の魔導書';
            desc = 'ふふふ〜 これが使えるコマンドのリストよ、我が下僕！ ✨';
            f1 = '> `mao.leave` - 魔王様を城に帰す\n> `mao.stream [fallback]` - JPOPラジオを再生\n> `mao.stop` - 音楽魔法を停止\n> `mao.info` - 現在の曲を確認\n> `mao.info.auto` - 自動情報表示を切り替え\n> `mao.lang <ID/EN/JP>` - 言語を変更';
            f2 = '> `mao.play <url/title>` - YT/SoundCloudから曲を再生\n> `mao.queue` - キューを確認\n> `mao.skip` - 曲をスキップ\n> `mao.pause` - 曲を一時停止\n> `mao.resume` - 曲を再開\n> `mao.loop` - 現在の曲をループ';
            f3 = '> `mao.move` - 魔王様をあなたのチャンネルに移動\n> `mao.ownership.move @user` - 契約を譲渡';
        } else {
            title = '📜 Buku Sihir Maou-sama';
            desc = 'Fufufu~ Ini daftar perintah yang bisa kamu gunakan, pelayanku! ✨';
            f1 = '> `mao.leave` - Suruh Maou-sama kembali ke kastil\n> `mao.stream [fallback]` - Putar radio JPOP\n> `mao.stop` - Hentikan sihir musik\n> `mao.info` - Lihat lagu yang sedang diputar\n> `mao.info.auto` - Toggle auto-info\n> `mao.lang <ID/EN/JP>` - Ubah bahasa';
            f2 = '> `mao.play <url/judul>` - Putar lagu dari YT/SoundCloud\n> `mao.queue` - Lihat antrean lagu\n> `mao.skip` - Lewati lagu saat ini\n> `mao.pause` - Jeda lagu\n> `mao.resume` - Lanjutkan lagu\n> `mao.loop` - Ulangi lagu saat ini';
            f3 = '> `mao.move` - Pindahkan Maou-sama ke channelmu\n> `mao.ownership.move @user` - Pindah kontrak ke pelayan lain';
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

        message.reply({ embeds: [embed] });
    },
};