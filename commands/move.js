const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

module.exports = {
    name: 'move',
    execute(message) {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) return message.reply('Hah? Maou-sama bahkan tidak ada di voice channel! 😤');

        const session = players.get(message.guild.id);
        if (session && session.ownerId !== message.author.id) {
            return message.reply(getMsg(message.guild.id, 'notOwner', { ownerId: session.ownerId }));
        }

        const targetChannel = message.member.voice.channel;
        if (!targetChannel) return message.reply(getMsg(message.guild.id, 'noVoice'));

        if (connection.joinConfig.channelId === targetChannel.id) {
            return message.reply('Bodoh! Maou-sama sudah ada di channel itu! 💢');
        }

        joinVoiceChannel({
            channelId: targetChannel.id,
            guildId: targetChannel.guild.id,
            adapterCreator: targetChannel.guild.voiceAdapterCreator,
        });

        message.reply(getMsg(message.guild.id, 'moved'));
    },
};