const { SlashCommandBuilder } = require('discord.js');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const guildId = r.guildId;
    const session = players.get(guildId);
    if (!session) return r.reply(getMsg(guildId, 'queueEmptyList'));
    if (session.ownerId !== r.userId) return r.reply(getMsg(guildId, 'notOwner', { ownerId: session.ownerId }));
    if (!isInSameVoiceChannel(r)) return r.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');

    session.player.unpause();
    r.reply(getMsg(guildId, 'resumed'));
}

module.exports = {
    name: 'resume',
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Lanjutkan lagu yang sedang dijeda'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
