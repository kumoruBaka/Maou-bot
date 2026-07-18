const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const guildId = r.guildId;
    const connection = getVoiceConnection(guildId);
    if (!connection) return r.reply('Hah? Maou-sama bahkan tidak ada di voice channel! Jangan memerintah sembarangan! 😤');

    const session = players.get(guildId);
    if (session && session.ownerId !== r.userId) {
        return r.reply(getMsg(guildId, 'notOwner', { ownerId: session.ownerId }));
    }
    if (!isInSameVoiceChannel(r)) return r.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');

    connection.destroy();
    players.delete(guildId);
    r.reply(getMsg(guildId, 'left'));
}

module.exports = {
    name: 'leave',
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Suruh Maou-sama meninggalkan voice channel'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
