const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'ownership.move',
    execute(message) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));

        if (session.ownerId !== message.author.id) {
            return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply(getMsg(message.guild.id, 'ownerMoveError'));

        if (targetUser.bot) return message.reply('Maou-sama tidak mau membuat kontrak dengan sesama bot! 😤');
        if (targetUser.id === message.author.id) return message.reply('Bodoh! Kamu mencoba memindahkan kontrak ke dirimu sendiri?! 💢');

        session.ownerId = targetUser.id;
        message.reply(getMsg(message.guild.id, 'ownerMoved', { newOwnerId: targetUser.id }));
    },
};