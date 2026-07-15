const { EmbedBuilder } = require('discord.js');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'queue',
    execute(message) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));
        if (session.isRadio) return message.reply('Bodoh! Ini siaran radio langsung, tidak ada antrean! 💢');

        const embed = new EmbedBuilder()
            .setColor('#ff0055')
            .setTitle(getMsg(message.guild.id, 'queueList').replace('\n\n', ''))
            .setFooter({ text: 'Maou-sama Player 🎵' })
            .setTimestamp();

        let description = '';

        if (session.currentTrack) {
            description += `**Sedang Mengalun:**\n> ${session.currentTrack.title} ${session.loop ? '🔁' : ''}\n\n`;
        }

        if (session.queue.length > 0) {
            description += '**Menunggu Giliran:**\n';
            session.queue.forEach((track, index) => {
                // Batasi tampilan antrean maksimal 10 lagu supaya embed tidak kepanjangan
                if (index < 10) {
                    description += `\`${index + 1}.\` ${track.title}\n`;
                }
            });
            if (session.queue.length > 10) {
                description += `\n*...dan ${session.queue.length - 10} lagu lainnya menunggu dalam kegelapan.*`;
            }
        } else {
            description += '*Tidak ada lagu lain yang menunggu.*';
        }

        embed.setDescription(description);
        message.reply({ embeds: [embed] });
    },
};