const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'auto',
    execute(message) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'noVoice'));

        session.autoPlay = !session.autoPlay;
        
        if (session.autoPlay) {
            message.reply(getMsg(message.guild.id, 'autoOn'));
        } else {
            message.reply(getMsg(message.guild.id, 'autoOff'));
        }
    },
};