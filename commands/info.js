const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const listenMoe = require('../listenMoeWs');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const song = listenMoe.getCurrentSong();
    if (!song) {
        return r.reply('Ugh, sihir pengintainya belum siap! Maou-sama belum mendapat info dari dunia manusia. Tunggu sebentar! 💢');
    }

    const title = song.title || 'Unknown Title';
    const artists = song.artists?.length > 0
        ? song.artists.map(a => a.name).join(', ')
        : 'Unknown Artist';

    const embed = new EmbedBuilder()
        .setColor('#ff0055')
        .setTitle('🎵 JPOP Stream Info')
        .setDescription('Fufufu~ Ini lagu yang sedang mengalun, pelayanku! ✨')
        .addFields(
            { name: 'Title', value: `> **${title}**`, inline: false },
            { name: 'Artist', value: `> *${artists}*`, inline: false }
        )
        .setFooter({ text: 'Maou-sama Radio 📻' })
        .setTimestamp();

    if (song.artists?.[0]?.image) {
        embed.setThumbnail(`https://cdn.listen.moe/artists/${song.artists[0].image}`);
    } else if (song.albums?.[0]?.image) {
        embed.setThumbnail(`https://cdn.listen.moe/covers/${song.albums[0].image}`);
    }

    r.reply({ embeds: [embed] });
}

module.exports = {
    name: 'info',
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Lihat info lagu yang sedang diputar di radio listen.moe'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
