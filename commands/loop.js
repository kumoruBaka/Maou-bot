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
    if (session.isRadio) return r.reply('Bodoh! Ini siaran radio langsung, tidak bisa diulang! 💢');

    session.loop = !session.loop;
    r.reply(getMsg(guildId, session.loop ? 'loopOn' : 'loopOff'));
}

module.exports = {
    name: 'loop',
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Aktifkan atau matikan pengulangan lagu saat ini'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
