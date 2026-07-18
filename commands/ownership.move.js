const { SlashCommandBuilder } = require('discord.js');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { Responder } = require('../utils/responder');

function executeLogic(r, targetUser) {
    const guildId = r.guildId;
    const session = players.get(guildId);
    if (!session) return r.reply(getMsg(guildId, 'queueEmptyList'));
    if (session.ownerId !== r.userId) return r.reply(getMsg(guildId, 'notOwner', { ownerId: session.ownerId }));
    if (!targetUser) return r.reply(getMsg(guildId, 'ownerMoveError'));
    if (targetUser.bot) return r.reply('Maou-sama tidak mau membuat kontrak dengan sesama bot! 😤');
    if (targetUser.id === r.userId) return r.reply('Bodoh! Kamu mencoba memindahkan kontrak ke dirimu sendiri?! 💢');

    session.ownerId = targetUser.id;
    r.reply(getMsg(guildId, 'ownerMoved', { newOwnerId: targetUser.id }));
}

module.exports = {
    name: 'ownership.move',
    // Slash commands tidak bisa pakai titik — gunakan 'ownership-move'
    slashName: 'ownership-move',
    data: new SlashCommandBuilder()
        .setName('ownership-move')
        .setDescription('Pindahkan kepemilikan sesi musik ke user lain')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('User yang akan menjadi pemilik baru')
                .setRequired(true)),

    execute(message) {
        const targetUser = message.mentions?.users?.first() || null;
        executeLogic(new Responder(message), targetUser);
    },
    executeSlash(interaction) {
        const targetUser = interaction.options.getUser('user');
        executeLogic(new Responder(interaction), targetUser);
    },
};
