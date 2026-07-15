const WebSocket = require('ws');
const { EmbedBuilder, ActivityType } = require('discord.js');

let currentSong = null;
let ws = null;
let autoInfoChannels = new Set(); // Set of channel IDs
let discordClient = null;

function updateBotPresence(song) {
    if (!discordClient || !discordClient.user) return;
    
    if (!song) {
        discordClient.user.setActivity('Keheningan', { type: ActivityType.Listening });
        return;
    }

    const title = song.title || 'Unknown Title';
    const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : 'Unknown Artist';
    
    discordClient.user.setActivity(`${title} - ${artist}`, { 
        type: ActivityType.Listening 
    });
}

function connect() {
    ws = new WebSocket('wss://listen.moe/gateway_v2');

    ws.on('open', () => {
        console.log('Connected to listen.moe WebSocket');
    });

    ws.on('message', (data) => {
        try {
            const payload = JSON.parse(data);
            
            // op: 1 = TRACK_UPDATE
            if (payload.op === 1 && payload.t === 'TRACK_UPDATE') {
                const newSong = payload.d.song;
                
                // Cek apakah lagu benar-benar ganti
                if (!currentSong || currentSong.id !== newSong.id) {
                    currentSong = newSong;
                    updateBotPresence(currentSong);
                    broadcastNewSong(currentSong);
                }
            }
        } catch (error) {
            console.error('WebSocket parse error:', error);
        }
    });

    ws.on('close', () => {
        console.log('listen.moe WebSocket closed. Reconnecting in 5s...');
        setTimeout(connect, 5000);
    });

    ws.on('error', (error) => {
        console.error('listen.moe WebSocket error:', error.message);
        ws.close();
    });
}

function broadcastNewSong(song) {
    if (!discordClient || autoInfoChannels.size === 0) return;

    const title = song.title || 'Unknown Title';
    const artists = song.artists && song.artists.length > 0 
        ? song.artists.map(a => a.name).join(', ') 
        : 'Unknown Artist';
        
    const embed = new EmbedBuilder()
        .setColor('#ff0055')
        .setTitle('🎵 Now Playing (Auto)')
        .setDescription(`Fufufu~ Lagu baru telah mengalun! ✨`)
        .addFields(
            { name: 'Title', value: `> **${title}**`, inline: false },
            { name: 'Artist', value: `> *${artists}*`, inline: false }
        )
        .setFooter({ text: 'Maou-sama Radio 📻' })
        .setTimestamp();

    if (song.artists && song.artists[0] && song.artists[0].image) {
        embed.setThumbnail(`https://cdn.listen.moe/artists/${song.artists[0].image}`);
    } else if (song.albums && song.albums[0] && song.albums[0].image) {
        embed.setThumbnail(`https://cdn.listen.moe/covers/${song.albums[0].image}`);
    }

    for (const channelId of autoInfoChannels) {
        const channel = discordClient.channels.cache.get(channelId);
        if (channel) {
            channel.send({ embeds: [embed] }).catch(console.error);
        } else {
            // Hapus channel kalau bot sudah tidak bisa akses
            autoInfoChannels.delete(channelId);
        }
    }
}

// Start connection
connect();

module.exports = {
    getCurrentSong: () => currentSong,
    setClient: (client) => { discordClient = client; },
    toggleAutoInfo: (channelId) => {
        if (autoInfoChannels.has(channelId)) {
            autoInfoChannels.delete(channelId);
            return false; // Dimatikan
        } else {
            autoInfoChannels.add(channelId);
            return true; // Dinyalakan
        }
    }
};