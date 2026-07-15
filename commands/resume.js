const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'resume',
    execute(message) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));
        if (session.ownerId !== message.author.id) return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));

        session.player.unpause();
        message.reply(getMsg(message.guild.id, 'resumed'));
    },
};