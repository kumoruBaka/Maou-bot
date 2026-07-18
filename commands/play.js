const { createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const fetch = require('node-fetch');
const { scrapeYt, extractVideoId } = require('../utils/ytScraper');
const { getAutoRecommendation } = require('../utils/ytAuto');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');
const { getOrCreateSession } = require('../utils/session');

// ─── Playback Engine ──────────────────────────────────────────────────────────

/**
 * Buat AudioResource dari TrackInfo.
 * Mendukung dua mode:
 *  - isScraped=true  → direct URL (createAudioResource langsung)
 *  - isScraped=false → play-dl stream (untuk URL YouTube non-scraped)
 */
async function buildAudioResource(track) {
    if (track.isScraped) {
        return createAudioResource(track.url, { inlineVolume: true });
    }
    const stream = await play.stream(track.url);
    return createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
}

/**
 * Ambil lagu berikutnya dari antrian dan mulai diputar.
 * Menangani: loop, autoPlay, antrian kosong.
 */
async function playNext(guildId, message) {
    const session = players.get(guildId);
    if (!session) return;

    // ── Antrian kosong & tidak loop ──────────────────────────────────────────
    if (session.queue.length === 0 && !session.loop) {
        if (session.autoPlay) {
            // Coba dapatkan rekomendasi otomatis
            const currentUrl = session.currentTrack?.originalUrl || null;
            const nextUrl = await getAutoRecommendation(currentUrl, session.autoGenre);

            if (nextUrl) {
                const videoId = extractVideoId(nextUrl);
                try {
                    const scraped = await scrapeYt(videoId);
                    session.queue.push({
                        title: scraped.title,
                        url: scraped.url,
                        thumbnail: scraped.thumbnail,
                        isScraped: scraped.isScraped,
                        originalUrl: nextUrl
                    });
                } catch (err) {
                    console.error(`[play] Auto-play scrape gagal: ${err.message}`);
                    message.channel.send(
                        `Ugh! Sihir rekomendasi otomatis gagal mendapatkan audio! 💢\n> *${err.message}*`
                    );
                    session.currentTrack = null;
                    return;
                }
            } else {
                message.channel.send(getMsg(guildId, 'queueEmpty'));
                session.currentTrack = null;
                return;
            }
        } else {
            message.channel.send(getMsg(guildId, 'queueEmpty'));
            session.currentTrack = null;
            return;
        }
    }

    // ── Tentukan track yang akan diputar ─────────────────────────────────────
    let track;
    if (session.loop && session.currentTrack) {
        track = session.currentTrack;
    } else {
        track = session.queue.shift();
        session.currentTrack = track;
    }

    // ── Buat resource & mulai putar ──────────────────────────────────────────
    try {
        const resource = await buildAudioResource(track);
        resource.volume.setVolume((session.volume ?? 100) / 100);
        session.player.play(resource);

        if (!session.loop) {
            const embed = new EmbedBuilder()
                .setColor('#ff0055')
                .setDescription(getMsg(guildId, 'playing', { title: track.title }))
                .setImage(track.thumbnail || null);
            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[play] Gagal memutar "${track.title}": ${error.message}`);
        message.channel.send(
            getMsg(guildId, 'playError', { title: track.title }) +
            `\n> *${error.message}*`
        );
        // Skip ke lagu berikutnya
        playNext(guildId, message);
    }
}

// ─── Command Handler ──────────────────────────────────────────────────────────

module.exports = {
    name: 'play',

    async execute(message, args) {
        const guildId = message.guild.id;
        const query = args.join(' ');
        if (!query) return message.reply(getMsg(guildId, 'emptyQuery'));

        // Pastikan session & voice connection tersedia
        const { session } = getOrCreateSession(message, playNext);
        if (!session) return message.reply(getMsg(guildId, 'noVoice'));

        try {
            const trackInfo = await resolveQuery(query, guildId, message);
            if (!trackInfo) return; // resolveQuery sudah kirim reply bila gagal

            session.queue.push(trackInfo);

            if (session.player.state.status === AudioPlayerStatus.Idle) {
                playNext(guildId, message);
            } else {
                message.reply(getMsg(guildId, 'added', { title: trackInfo.title }));
            }

        } catch (error) {
            console.error(`[play] Error tidak terduga saat execute: ${error.message}`);
            message.reply(
                getMsg(guildId, 'searchError') +
                `\n> *${error.message}*`
            );
        }
    },

    playNext
};

// ─── Query Resolver ───────────────────────────────────────────────────────────

/**
 * Resolve query pengguna (URL/judul) ke TrackInfo.
 * Mengirim reply ke message.channel bila terjadi error.
 * Return null bila gagal, TrackInfo bila berhasil.
 */
async function resolveQuery(query, guildId, message) {
    // ── SoundCloud ────────────────────────────────────────────────────────────
    if (query.includes('soundcloud.com') || query.includes('snd.sc')) {
        try {
            const scRes = await fetch(
                `https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(query)}`
            );
            if (!scRes.ok) throw new Error(`SoundCloud API HTTP ${scRes.status}`);
            const scData = await scRes.json();
            if (!scData.status) throw new Error('SoundCloud: track tidak ditemukan atau URL tidak valid');

            return {
                title: scData.data.title,
                url: scData.data.url,
                thumbnail: scData.data.thumbnail,
                isScraped: true,
                originalUrl: query
            };
        } catch (err) {
            console.error(`[play] SoundCloud resolve gagal: ${err.message}`);
            message.reply(
                getMsg(guildId, 'notFound') +
                `\n> *${err.message}*`
            );
            return null;
        }
    }

    // ── URL YouTube / URL lainnya ─────────────────────────────────────────────
    if (query.startsWith('http')) {
        const videoId = extractVideoId(query);

        if (videoId) {
            // URL YouTube — gunakan scraper (dengan retry + fallback bawaan)
            try {
                const scraped = await scrapeYt(videoId);
                return {
                    title: scraped.title,
                    url: scraped.url,
                    thumbnail: scraped.thumbnail,
                    isScraped: scraped.isScraped,
                    originalUrl: query
                };
            } catch (err) {
                console.error(`[play] YouTube URL resolve gagal: ${err.message}`);
                message.reply(
                    getMsg(guildId, 'notFound') +
                    `\n> *${err.message}*`
                );
                return null;
            }
        }

        // URL non-YouTube (mis. URL direct audio)
        try {
            const info = await play.video_info(query);
            return {
                title: info.video_details.title,
                url: info.video_details.url,
                thumbnail: info.video_details.thumbnails?.[0]?.url || null,
                isScraped: false,
                originalUrl: query
            };
        } catch (err) {
            console.error(`[play] URL non-YT resolve gagal: ${err.message}`);
            message.reply(
                getMsg(guildId, 'notFound') +
                `\n> *${err.message}*`
            );
            return null;
        }
    }

    // ── Pencarian teks ────────────────────────────────────────────────────────
    try {
        const searchResults = await play.search(query, { limit: 1 });
        if (!searchResults || searchResults.length === 0) {
            message.reply(getMsg(guildId, 'notFound'));
            return null;
        }

        const topResult = searchResults[0];
        const videoId = extractVideoId(topResult.url);

        if (videoId) {
            // Resolve via scraper (retry + fallback otomatis)
            try {
                const scraped = await scrapeYt(videoId);
                return {
                    title: scraped.title,
                    url: scraped.url,
                    thumbnail: scraped.thumbnail,
                    isScraped: scraped.isScraped,
                    originalUrl: topResult.url
                };
            } catch (err) {
                // Scraper + fallback keduanya gagal — masih bisa coba play-dl langsung
                console.warn(`[play] Scraper+fallback gagal untuk "${query}", coba play-dl langsung: ${err.message}`);
                return {
                    title: topResult.title,
                    url: topResult.url,
                    thumbnail: topResult.thumbnails?.[0]?.url || null,
                    isScraped: false,
                    originalUrl: topResult.url
                };
            }
        }

        // Video ID tidak bisa diekstrak — pakai URL mentah play-dl
        return {
            title: topResult.title,
            url: topResult.url,
            thumbnail: topResult.thumbnails?.[0]?.url || null,
            isScraped: false,
            originalUrl: topResult.url
        };

    } catch (err) {
        console.error(`[play] Pencarian gagal untuk query "${query}": ${err.message}`);
        message.reply(
            getMsg(guildId, 'searchError') +
            `\n> *${err.message}*`
        );
        return null;
    }
}
