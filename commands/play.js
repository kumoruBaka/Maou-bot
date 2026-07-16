const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const fetch = require('node-fetch');
const { scrapeYt, extractVideoId } = require('../utils/ytScraper');
const { getAutoRecommendation } = require('../utils/ytAuto');
const players = require('../playerStore');
const { getMsg } = require('../utils/lang');

async function playNext(guildId, message) {
    const session = players.get(guildId);
    if (!session) return;

    if (session.queue.length === 0 && !session.loop) {
        if (session.autoPlay && session.currentTrack && session.currentTrack.url.includes('youtube.com')) {
            const nextUrl = await getAutoRecommendation(session.currentTrack.url);
            if (nextUrl) {
                const videoId = extractVideoId(nextUrl);
                const scraped = await scrapeYt(videoId);
                session.queue.push({
                    title: scraped.title,
                    url: scraped.url,
                    thumbnail: scraped.thumbnail,
                    isScraped: true
                });
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

    let track;
    if (session.loop && session.currentTrack) {
        track = session.currentTrack;
    } else {
        track = session.queue.shift();
        session.currentTrack = track;
    }

    try {
        let resource;
        if (track.isScraped) {
            resource = createAudioResource(track.url);
        } else {
            const stream = await play.stream(track.url);
            resource = createAudioResource(stream.stream, { inputType: stream.type });
        }
        session.player.play(resource);

        if (!session.loop) {
            const embed = new EmbedBuilder()
                .setColor('#ff0055')
                .setDescription(getMsg(guildId, 'playing', { title: track.title }))
                .setImage(track.thumbnail || null);
            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Play error:', error);
        message.channel.send(getMsg(guildId, 'playError', { title: track.title }));
        playNext(guildId, message);
    }
}

module.exports = {
    name: 'play',
    async execute(message, args) {
        const query = args.join(' ');
        if (!query) return message.reply(getMsg(message.guild.id, 'emptyQuery'));

        let connection = getVoiceConnection(message.guild.id);
        
        // Auto-join
        if (!connection) {
            const channel = message.member.voice.channel;
            if (!channel) return message.reply(getMsg(message.guild.id, 'noVoice'));
            
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
        }

        let session = players.get(message.guild.id);
        
        // Jika sedang radio, stop dulu
        if (session && session.isRadio) {
            session.player.stop(true);
            session = null;
        }

        if (!session) {
            const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
            connection.subscribe(player);
            
            session = {
                player: player,
                ownerId: message.author.id,
                queue: [],
                loop: false,
                autoPlay: false,
                currentTrack: null,
                isRadio: false
            };
            players.set(message.guild.id, session);

            player.on(AudioPlayerStatus.Idle, () => {
                playNext(message.guild.id, message);
            });

            player.on('error', error => {
                console.error('Player error:', error.message);
                playNext(message.guild.id, message);
            });
        }

        // Hapus pengecekan ownerId di sini agar semua orang bisa tambah antrean
        // if (session.ownerId !== message.author.id) { ... }

        try {
            let trackInfo;

            if (query.includes('soundcloud.com') || query.includes('snd.sc')) {
                const scRes = await fetch(`https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(query)}`);
                const scData = await scRes.json();
                if (!scData.status) return message.reply(getMsg(message.guild.id, 'notFound'));
                trackInfo = {
                    title: scData.data.title,
                    url: scData.data.url,
                    thumbnail: scData.data.thumbnail,
                    isScraped: true
                };
            } else if (query.startsWith('http')) {
                const videoId = extractVideoId(query);
                if (videoId) {
                    const scraped = await scrapeYt(videoId);
                    trackInfo = {
                        title: scraped.title,
                        url: scraped.url,
                        thumbnail: scraped.thumbnail,
                        isScraped: true
                    };
                } else {
                    const info = await play.video_info(query);
                    trackInfo = {
                        title: info.video_details.title,
                        url: info.video_details.url,
                        thumbnail: info.video_details.thumbnails[0].url,
                        isScraped: false
                    };
                }
            } else {
                const searchResults = await play.search(query, { limit: 1 });
                if (!searchResults || searchResults.length === 0) {
                    return message.reply(getMsg(message.guild.id, 'notFound'));
                }
                const videoId = extractVideoId(searchResults[0].url);
                if (videoId) {
                    const scraped = await scrapeYt(videoId);
                    trackInfo = {
                        title: scraped.title,
                        url: scraped.url,
                        thumbnail: scraped.thumbnail,
                        isScraped: true
                    };
                } else {
                    trackInfo = {
                        title: searchResults[0].title,
                        url: searchResults[0].url,
                        thumbnail: searchResults[0].thumbnails[0].url,
                        isScraped: false
                    };
                }
            }

            // Validasi URL sebelum masuk antrean
            if (!trackInfo.url) {
                return message.reply(getMsg(message.guild.id, 'notFound'));
            }

            session.queue.push(trackInfo);

            if (session.player.state.status === AudioPlayerStatus.Idle) {
                playNext(message.guild.id, message);
            } else {
                message.reply(getMsg(message.guild.id, 'added', { title: trackInfo.title }));
            }

        } catch (error) {
            console.error('Search/Info error:', error);
            message.reply(getMsg(message.guild.id, 'searchError'));
        }
    },
};