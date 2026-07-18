const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const players = require('../playerStore');

/**
 * Buat atau kembalikan session yang sudah ada untuk guild.
 * Jika session baru dibuat, player di-subscribe ke connection.
 * @param {import('discord.js').Message} message
 * @param {Function} playNextFn - fungsi playNext(guildId, message) dari caller
 * @returns {{ session: object, isNew: boolean }}
 */
function getOrCreateSession(message, playNextFn) {
    const guildId = message.guild.id;

    let connection = require('@discordjs/voice').getVoiceConnection(guildId);
    if (!connection) {
        const channel = message.member.voice.channel;
        if (!channel) return { session: null, isNew: false };
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
    }

    let session = players.get(guildId);
    if (session && session.isRadio) {
        session.player.stop(true);
        session = null;
    }

    if (session) return { session, connection, isNew: false };

    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    connection.subscribe(player);

    session = {
        player,
        ownerId: message.author.id,
        queue: [],
        loop: false,
        autoPlay: false,
        autoGenre: 'j-pop',
        currentTrack: null,
        isRadio: false,
    };
    players.set(guildId, session);

    player.on(AudioPlayerStatus.Idle, () => playNextFn(guildId, message));
    player.on('error', error => {
        console.error('Player error:', error.message);
        playNextFn(guildId, message);
    });

    return { session, connection, isNew: true };
}

/**
 * Cek apakah user berada di VC yang sama dengan bot.
 * Return true bila bot tidak di VC (tidak perlu cek).
 */
function isInSameVoiceChannel(message) {
    const { getVoiceConnection } = require('@discordjs/voice');
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return true;
    const botChannelId = connection.joinConfig.channelId;
    return message.member.voice.channelId === botChannelId;
}

module.exports = { getOrCreateSession, isInSameVoiceChannel };
