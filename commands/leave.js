const { getVoiceConnection } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'leave',
    execute(message) {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) return message.reply('Hah? Maou-sama bahkan tidak ada di voice channel! Jangan memerintah sembarangan! 😤');
        
        const session = players.get(message.guild.id);
        if (session && session.ownerId !== message.author.id) {
            return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        }

        // Disconnect
        connection.destroy();
        players.delete(message.guild.id);
        message.reply(getMsg(message.guild.id, 'left'));
    },
};