const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { playNext } = require('./play'); // Need to export playNext from play.js

module.exports = {
    name: 'auto',
    execute(message, args) {
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

        let session = players.get(message.guild.id);
        
        if (!session) {
            const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
            connection.subscribe(player);
            
            session = {
                player: player,
                ownerId: message.author.id,
                queue: [],
                loop: false,
                autoPlay: false,
                autoGenre: 'j-pop',
                currentTrack: null,
                isRadio: false
            };
            players.set(message.guild.id, session);

            player.on(AudioPlayerStatus.Idle, () => {
                playNext(message.guild.id, message);
            });

            player.on('error', error => {
                console.error('Player error:', error.message);
                playNext(message.guild.id, message);
            });
        }

        const genre = args.join(' ') || 'j-pop';
        session.autoGenre = genre;
        session.autoPlay = !session.autoPlay;
        
        if (session.autoPlay) {
            message.reply(getMsg(message.guild.id, 'autoOn') + ` (Genre: ${genre})`);
            if (session.player.state.status === AudioPlayerStatus.Idle && session.queue.length === 0) {
                playNext(message.guild.id, message);
            }
        } else {
            message.reply(getMsg(message.guild.id, 'autoOff'));
        }
    },
};