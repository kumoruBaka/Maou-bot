const { SlashCommandBuilder } = require('discord.js');
const listenMoe = require('../listenMoeWs');
const { getMsg } = require('../utils/lang');
const { Responder } = require('../utils/responder');

function executeLogic(r) {
    const isEnabled = listenMoe.toggleAutoInfo(r.channel.id, r.guildId);
    if (isEnabled) {
        r.reply(getMsg(r.guildId, 'autoOn').replace('rekomendasi otomatis', 'pengintai otomatis'));
    } else {
        r.reply(getMsg(r.guildId, 'autoOff').replace('rekomendasi otomatis', 'pengintai otomatis'));
    }
}

module.exports = {
    name: 'info.auto',
    // Slash commands tidak bisa pakai titik di nama — gunakan 'infoauto'
    slashName: 'infoauto',
    data: new SlashCommandBuilder()
        .setName('infoauto')
        .setDescription('Toggle notifikasi otomatis pergantian lagu radio di channel ini'),

    execute(message) { executeLogic(new Responder(message)); },
    executeSlash(interaction) { executeLogic(new Responder(interaction)); },
};
