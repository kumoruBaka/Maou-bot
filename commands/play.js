const { SlashCommandBuilder } = require('discord.js');
const { createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const fetch = require('node-fetch');
const { scrapeYt, extractVideoId } = require('../utils/ytScraper');
const { getAutoRecommendation } = require('../utils/ytAuto');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { getOrCreateSession } = require('../utils/session');
const { Responder } = require('../utils/responder');

// ─── Audio Resource Builder ───────────────────────────────────────────────────

async function buildAudioResource(track) {
    if (track.isScraped) return createAudioResource(track.url);
    const stream = await play.stream(track.url);
    return createAudioResource(stream.stream, { inputType: stream.type });
}

// ─── Playback Engine ──────────────────────────────────────────────────────────

async function playNext(guildId, r) {
    const session = players.get(guildId);
    if (!session) return;

    if (session.queue.length === 0 && !session.loop) {
        if (session.autoPlay) {
            const currentUrl = session.currentTrack?.originalUrl || null;
            const nextUrl = await getAutoRecommendation(currentUrl, session.autoGenre);
            if (nextUrl) {
                const videoId = extractVideoId(nextUrl);
                try {
                    const scraped = await scrapeYt(videoId);
                    session.queue.push({ title: scraped.title, url: scraped.url, thumbnail: scraped.thumbnail, isScraped: scraped.isScraped, originalUrl: nextUrl });
                } catch (err) {
                    console.error(`[play] Auto-play scrape gagal: ${err.message}`);
                    await r.send(`Ugh! Sihir rekomendasi otomatis gagal mendapatkan audio! 💢\n> *${err.message}*`);
                    session.currentTrack = null;
                    return;
                }
            } else {
                await r.send(getMsg(guildId, 'queueEmpty'));
                session.currentTrack = null;
                return;
            }
        } else {
            await r.send(getMsg(guildId, 'queueEmpty'));
            session.currentTrack = null;
            return;
        }
    }

    const track = (session.loop && session.currentTrack) ? session.currentTrack : session.queue.shift();
    session.currentTrack = track;

    try {
        const resource = await buildAudioResource(track);
        session.player.play(resource);
        if (!session.loop) {
            const embed = new EmbedBuilder()
                .setColor('#ff0055')
                .setDescription(getMsg(guildId, 'playing', { title: track.title }))
                .setImage(track.thumbnail || null);
            await r.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[play] Gagal memutar "${track.title}": ${error.message}`);
        await r.send(getMsg(guildId, 'playError', { title: track.title }) + `\n> *${error.message}*`);
        playNext(guildId, r);
    }
}

// ─── Query Resolver ───────────────────────────────────────────────────────────

async function resolveQuery(query, guildId, r) {
    if (query.includes('soundcloud.com') || query.includes('snd.sc')) {
        try {
            const scRes = await fetch(`https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(query)}`);
            if (!scRes.ok) throw new Error(`SoundCloud API HTTP ${scRes.status}`);
            const scData = await scRes.json();
            if (!scData.status) throw new Error('SoundCloud: track tidak ditemukan atau URL tidak valid');
            return { title: scData.data.title, url: scData.data.url, thumbnail: scData.data.thumbnail, isScraped: true, originalUrl: query };
        } catch (err) {
            console.error(`[play] SoundCloud gagal: ${err.message}`);
            await r.reply(getMsg(guildId, 'notFound') + `\n> *${err.message}*`);
            return null;
        }
    }

    if (query.startsWith('http')) {
        const videoId = extractVideoId(query);
        if (videoId) {
            try {
                const scraped = await scrapeYt(videoId);
                return { title: scraped.title, url: scraped.url, thumbnail: scraped.thumbnail, isScraped: scraped.isScraped, originalUrl: query };
            } catch (err) {
                console.error(`[play] YouTube URL gagal: ${err.message}`);
                await r.reply(getMsg(guildId, 'notFound') + `\n> *${err.message}*`);
                return null;
            }
        }
        try {
            const info = await play.video_info(query);
            return { title: info.video_details.title, url: info.video_details.url, thumbnail: info.video_details.thumbnails?.[0]?.url || null, isScraped: false, originalUrl: query };
        } catch (err) {
            console.error(`[play] URL non-YT gagal: ${err.message}`);
            await r.reply(getMsg(guildId, 'notFound') + `\n> *${err.message}*`);
            return null;
        }
    }

    try {
        const results = await play.search(query, { limit: 1 });
        if (!results || results.length === 0) { await r.reply(getMsg(guildId, 'notFound')); return null; }
        const top = results[0];
        const videoId = extractVideoId(top.url);
        if (videoId) {
            try {
                const scraped = await scrapeYt(videoId);
                return { title: scraped.title, url: scraped.url, thumbnail: scraped.thumbnail, isScraped: scraped.isScraped, originalUrl: top.url };
            } catch (err) {
                console.warn(`[play] Scraper gagal, fallback play-dl langsung: ${err.message}`);
                return { title: top.title, url: top.url, thumbnail: top.thumbnails?.[0]?.url || null, isScraped: false, originalUrl: top.url };
            }
        }
        return { title: top.title, url: top.url, thumbnail: top.thumbnails?.[0]?.url || null, isScraped: false, originalUrl: top.url };
    } catch (err) {
        console.error(`[play] Pencarian gagal: ${err.message}`);
        await r.reply(getMsg(guildId, 'searchError') + `\n> *${err.message}*`);
        return null;
    }
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

async function executeLogic(r, query) {
    const guildId = r.guildId;
    if (!query) return r.reply(getMsg(guildId, 'emptyQuery'));

    await r.defer();
    const { session } = getOrCreateSession(r, playNext);
    if (!session) return r.reply(getMsg(guildId, 'noVoice'));

    try {
        const trackInfo = await resolveQuery(query, guildId, r);
        if (!trackInfo) return;

        session.queue.push(trackInfo);

        if (session.player.state.status === AudioPlayerStatus.Idle) {
            playNext(guildId, r);
        } else {
            r.reply(getMsg(guildId, 'added', { title: trackInfo.title }));
        }
    } catch (error) {
        console.error(`[play] Error tidak terduga: ${error.message}`);
        r.reply(getMsg(guildId, 'searchError') + `\n> *${error.message}*`);
    }
}

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
    name: 'play',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Putar lagu dari YouTube atau SoundCloud')
        .addStringOption(opt =>
            opt.setName('query')
                .setDescription('Judul lagu atau URL (YouTube / SoundCloud)')
                .setRequired(true)),

    execute(message, args) {
        const r = new Responder(message);
        executeLogic(r, args.join(' '));
    },

    executeSlash(interaction) {
        const r = new Responder(interaction);
        executeLogic(r, interaction.options.getString('query'));
    },

    playNext,
};
