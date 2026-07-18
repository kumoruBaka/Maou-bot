const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const guildId = r.guildId;
    const session = players.get(guildId);
    if (!session) return r.reply(getMsg(guildId, 'queueEmptyList'));
    if (session.isRadio) return r.reply('Bodoh! Ini siaran radio langsung, tidak ada antrean! 💢');

    const embed = new EmbedBuilder()
        .setColor('#ff0055')
        .setTitle(getMsg(guildId, 'queueList').replace('\n\n', ''))
        .setFooter({ text: 'Maou-sama Player 🎵' })
        .setTimestamp();

    let description = '';
    if (session.currentTrack) {
        description += `**Sedang Mengalun:**\n> ${session.currentTrack.title} ${session.loop ? '🔁' : ''}\n\n`;
    }
    if (session.queue.length > 0) {
        description += '**Menunggu Giliran:**\n';
        session.queue.forEach((track, index) => {
            if (index < 10) description += `\`${index + 1}.\` ${track.title}\n`;
        });
        if (session.queue.length > 10) {
            description += `\n*...dan ${session.queue.length - 10} lagu lainnya menunggu dalam kegelapan.*`;
        }
    } else {
        description += '*Tidak ada lagu lain yang menunggu.*';
    }

    embed.setDescription(description);
    r.reply({ embeds: [embed] });
}

module.exports = {
    name: 'queue',
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Tampilkan antrean lagu saat ini'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
