const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'stream',
    execute(message, args) {
        // Default ke main stream, fallback kalau ada argumen 'fallback'
        const isFallback = args[0] === 'fallback';
        const url = isFallback ? 'https://listen.moe/fallback' : 'https://listen.moe/stream';

        let connection = getVoiceConnection(message.guild.id);
        
        // Auto-join
        if (!connection) {
            const channel = message.member.voice.channel;
            if (!channel) return message.reply(getMsg(message.guild.id, 'noVoice'));
            
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
        }

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });
        
        // Biarkan FFmpeg handle transcode
        const resource = createAudioResource(url);

        player.play(resource);
        connection.subscribe(player);

        // Daftarkan player dan owner ke Map supaya mao.stop bisa akses dan cek ownership
        players.set(message.guild.id, {
            player: player,
            ownerId: message.author.id,
            queue: [],
            loop: false,
            currentTrack: null,
            isRadio: true
        });

        player.on('error', error => {
            console.error('Player error:', error.message);
            players.delete(message.guild.id);
        });

        message.reply(getMsg(message.guild.id, 'radioStart'));
        
        // debug
        player.on('stateChange', (oldState, newState) => {
        console.log(`Player state: ${oldState.status} -> ${newState.status}`);
        });

        connection.on('stateChange', (oldState, newState) => {
        console.log(`Connection state: ${oldState.status} -> ${newState.status}`);
        });
    },
};
