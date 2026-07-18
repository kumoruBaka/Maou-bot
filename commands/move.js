const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const guildId = r.guildId;
    const connection = getVoiceConnection(guildId);
    if (!connection) return r.reply('Hah? Maou-sama bahkan tidak ada di voice channel! 😤');

    const session = players.get(guildId);
    if (session && session.ownerId !== r.userId) {
        return r.reply(getMsg(guildId, 'notOwner', { ownerId: session.ownerId }));
    }

    const targetChannel = r.member?.voice?.channel;
    if (!targetChannel) return r.reply(getMsg(guildId, 'noVoice'));
    if (connection.joinConfig.channelId === targetChannel.id) {
        return r.reply('Bodoh! Maou-sama sudah ada di channel itu! 💢');
    }

    joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: targetChannel.guild.id,
        adapterCreator: targetChannel.guild.voiceAdapterCreator,
    });
    r.reply(getMsg(guildId, 'moved'));
}

module.exports = {
    name: 'move',
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Pindahkan Maou-sama ke voice channel kamu saat ini'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
