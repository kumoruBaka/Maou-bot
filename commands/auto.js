const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getMsg } = require('../utils/lang');
const { playNext } = require('./play');
const { getOrCreateSession } = require('../utils/session');
const { Responder } = require('../utils/responder');

function executeLogic(r, genre) {
    const guildId = r.guildId;
    const { session } = getOrCreateSession(r, playNext);
    if (!session) return r.reply(getMsg(guildId, 'noVoice'));

    session.autoGenre = genre || 'j-pop';
    session.autoPlay = !session.autoPlay;

    if (session.autoPlay) {
        r.reply(getMsg(guildId, 'autoOn') + ` (Genre: ${session.autoGenre})`);
        if (session.player.state.status === AudioPlayerStatus.Idle && session.queue.length === 0) {
            playNext(guildId, r);
        }
    } else {
        r.reply(getMsg(guildId, 'autoOff'));
    }
}

module.exports = {
    name: 'auto',
    data: new SlashCommandBuilder()
        .setName('auto')
        .setDescription('Toggle auto-play rekomendasi YouTube')
        .addStringOption(opt =>
            opt.setName('genre')
                .setDescription('Genre untuk rekomendasi (default: j-pop)')
                .setRequired(false)),

    execute(message, args) {
        executeLogic(new Responder(message), args.join(' ') || null);
    },
    executeSlash(interaction) {
        executeLogic(new Responder(interaction), interaction.options.getString('genre'));
    },
};
