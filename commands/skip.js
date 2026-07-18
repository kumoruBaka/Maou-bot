const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');

module.exports = {
    name: 'skip',
    execute(message) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));
        if (session.ownerId !== message.author.id) return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        if (!isInSameVoiceChannel(message)) return message.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');
        if (session.isRadio) return message.reply('Bodoh! Ini siaran radio langsung, tidak bisa dilewati! 💢');

        session.player.stop(); // Memicu event Idle yang akan memanggil playNext
        message.reply(getMsg(message.guild.id, 'skipped'));
    },
};