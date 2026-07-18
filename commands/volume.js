const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');

module.exports = {
    name: 'volume',
    execute(message, args) {
        const session = players.get(message.guild.id);
        if (!session) return message.reply(getMsg(message.guild.id, 'queueEmptyList'));
        if (session.ownerId !== message.author.id) return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        if (!isInSameVoiceChannel(message)) return message.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');

        const vol = parseInt(args[0]);
        if (isNaN(vol) || vol < 1 || vol > 100) {
            return message.reply(getMsg(message.guild.id, 'volumeInvalid'));
        }

        session.volume = vol;

        // Apply langsung ke resource yang sedang diputar bila ada
        const player = session.player;
        if (player.state?.resource?.volume) {
            player.state.resource.volume.setVolume(vol / 100);
        }

        message.reply(getMsg(message.guild.id, 'volumeSet', { volume: vol }));
    },
};
