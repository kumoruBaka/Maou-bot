const { getVoiceConnection } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');

module.exports = {
    name: 'stop',
    execute(message) {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) return message.reply('Hah? Maou-sama bahkan tidak ada di voice channel! 😤');

        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));
        if (session.ownerId !== message.author.id) return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        if (!isInSameVoiceChannel(message)) return message.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');

        // stop() aman dipanggil kapan saja, tidak crash meski sudah idle
        session.player.stop(true); // true = force stop, skip transition ke idle
        players.delete(message.guild.id);
        message.reply(getMsg(message.guild.id, 'stopped'));
    },
};