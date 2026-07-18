const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { isInSameVoiceChannel } = require('../utils/session');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const guildId = r.guildId;
    const connection = getVoiceConnection(guildId);
    if (!connection) return r.reply('Hah? Maou-sama bahkan tidak ada di voice channel! 😤');

    const session = players.get(guildId);
    if (!session) return r.reply(getMsg(guildId, 'queueEmptyList'));
    if (session.ownerId !== r.userId) return r.reply(getMsg(guildId, 'notOwner', { ownerId: session.ownerId }));
    if (!isInSameVoiceChannel(r)) return r.reply('Hmph! Kamu tidak ada di voice channel yang sama dengan Maou-sama! 💢');

    session.player.stop(true);
    players.delete(guildId);
    r.reply(getMsg(guildId, 'stopped'));
}

module.exports = {
    name: 'stop',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Hentikan musik dan bersihkan antrean'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
