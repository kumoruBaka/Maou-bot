const { AudioPlayerStatus } = require('@discordjs/voice');
const { getMsg } = require('../utils/lang');
const { playNext } = require('./play');
const { getOrCreateSession } = require('../utils/session');

module.exports = {
    name: 'auto',
    execute(message, args) {
        const { session } = getOrCreateSession(message, playNext);
        if (!session) return message.reply(getMsg(message.guild.id, 'noVoice'));

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