const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { Responder } = require('../utils/responder');

function executeLogic(r, useFallback = false) {
    const guildId = r.guildId;
    const url = useFallback ? 'https://listen.moe/fallback' : 'https://listen.moe/stream';

    let connection = getVoiceConnection(guildId);
    if (!connection) {
        const channel = r.member?.voice?.channel;
        if (!channel) return r.reply(getMsg(guildId, 'noVoice'));
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
    }

    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    const resource = createAudioResource(url);
    player.play(resource);
    connection.subscribe(player);

    players.set(guildId, {
        player,
        ownerId: r.userId,
        queue: [],
        loop: false,
        currentTrack: null,
        isRadio: true,
    });

    player.on('error', error => {
        console.error(`[stream] Player error: ${error.message}`);
        players.delete(guildId);
    });

    r.reply(getMsg(guildId, 'radioStart'));
}

module.exports = {
    name: 'stream',
    data: new SlashCommandBuilder()
        .setName('stream')
        .setDescription('Putar radio listen.moe JPOP')
        .addBooleanOption(opt =>
            opt.setName('fallback')
                .setDescription('Gunakan stream fallback listen.moe')
                .setRequired(false)),

    execute(message, args) {
        executeLogic(new Responder(message), args[0] === 'fallback');
    },
    executeSlash(interaction) {
        executeLogic(new Responder(interaction), interaction.options.getBoolean('fallback') ?? false);
    },
};
