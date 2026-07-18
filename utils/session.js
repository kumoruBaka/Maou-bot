const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const players = require('../playerStore');

/**
 * Buat atau kembalikan session yang sudah ada untuk guild.
 * Menerima Message (prefix) atau Responder (dual-mode).
 *
 * @param {import('discord.js').Message | import('./responder').Responder} source
 * @param {Function} playNextFn - fungsi playNext(guildId, responder)
 * @returns {{ session: object|null, connection: object|null, isNew: boolean }}
 */
function getOrCreateSession(source, playNextFn) {
    // Normalise: Responder expose guildId, userId, member; Message expose guild, author, member
    const guildId   = source.guildId  ?? source.guild?.id;
    const userId    = source.userId   ?? source.author?.id;
    const member    = source.member;

    let connection = getVoiceConnection(guildId);
    if (!connection) {
        const channel = member?.voice?.channel;
        if (!channel) return { session: null, connection: null, isNew: false };
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
        ownerId: userId,
        queue: [],
        loop: false,
        autoPlay: false,
        autoGenre: 'j-pop',
        currentTrack: null,
        isRadio: false,
    };
    players.set(guildId, session);

    player.on(AudioPlayerStatus.Idle, () => playNextFn(guildId, source));
    player.on('error', error => {
        console.error(`[session] Player error: ${error.message}`);
        playNextFn(guildId, source);
    });

    return { session, connection, isNew: true };
}

/**
 * Cek apakah user berada di VC yang sama dengan bot.
 * Menerima Message atau Responder.
 * Return true bila bot tidak di VC (tidak perlu cek).
 *
 * @param {import('discord.js').Message | import('./responder').Responder} source
 */
function isInSameVoiceChannel(source) {
    const guildId = source.guildId ?? source.guild?.id;
    const connection = getVoiceConnection(guildId);
    if (!connection) return true;
    const botChannelId = connection.joinConfig.channelId;
    return source.member?.voice?.channelId === botChannelId;
}

module.exports = { getOrCreateSession, isInSameVoiceChannel };
