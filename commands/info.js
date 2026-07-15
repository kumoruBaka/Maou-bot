const { EmbedBuilder } = require('discord.js');
const listenMoe = require('../listenMoeWs');

module.exports = {
    name: 'info',
    execute(message) {
        const song = listenMoe.getCurrentSong();

        if (!song) {
            return message.reply('Ugh, sihir pengintainya belum siap! Maou-sama belum mendapat info dari dunia manusia. Tunggu sebentar! 💢');
        }

        const title = song.title || 'Unknown Title';
        const artists = song.artists && song.artists.length > 0 
            ? song.artists.map(a => a.name).join(', ') 
            : 'Unknown Artist';
            
        const embed = new EmbedBuilder()
            .setColor('#ff0055')
            .setTitle('🎵 JPOP Stream Info')
            .setDescription(`Fufufu~ Ini lagu yang sedang mengalun, pelayanku! ✨`)
            .addFields(
                { name: 'Title', value: `> **${title}**`, inline: false },
                { name: 'Artist', value: `> *${artists}*`, inline: false }
            )
            .setFooter({ text: 'Maou-sama Radio 📻' })
            .setTimestamp();

        // Coba ambil image dari artist pertama kalau ada
        if (song.artists && song.artists[0] && song.artists[0].image) {
            embed.setThumbnail(`https://cdn.listen.moe/artists/${song.artists[0].image}`);
        } else if (song.albums && song.albums[0] && song.albums[0].image) {
            embed.setThumbnail(`https://cdn.listen.moe/covers/${song.albums[0].image}`);
        }

        message.reply({ embeds: [embed] });
    },
};