const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');

module.exports = {
    name: 'pause',
    execute(message) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));
        if (session.ownerId !== message.author.id) return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        if (!isInSameVoiceChannel(message)) return message.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');

        session.player.pause();
        message.reply(getMsg(message.guild.id, 'paused'));
    },
};