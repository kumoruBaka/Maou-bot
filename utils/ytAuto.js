const { google } = require('googleapis');
const { extractVideoId } = require('./ytScraper');

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

/**
 * Parse durasi ISO 8601 (PT3M45S) ke total detik.
 */
function parseDuration(durationStr) {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Cek apakah video layak diputar:
 * - Bukan live stream
 * - Durasi antara 61 detik s/d 10 menit (600 detik)
 */
function isEligibleVideo(video) {
    if (video.snippet.liveBroadcastContent !== 'none') return false;
    const totalSeconds = parseDuration(video.contentDetails.duration);
    if (totalSeconds <= 60) return false;   // filter Shorts
    if (totalSeconds > 600) return false;   // filter video > 10 menit
    return true;
}

/**
 * Ambil detail video (contentDetails + snippet) untuk satu videoId.
 * Return null bila tidak ditemukan.
 */
async function getVideoDetails(videoId) {
    const res = await youtube.videos.list({
        part: 'contentDetails,snippet',
        id: videoId
    });
    if (!res.data.items || res.data.items.length === 0) return null;
    return res.data.items[0];
}

/**
 * Cari video YouTube dan return URL pertama yang memenuhi kriteria.
 * @param {string} query - kata kunci pencarian
 * @param {number} maxResults - jumlah kandidat yang diambil
 */
async function searchEligibleVideo(query, maxResults = 10) {
    const res = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults
    });

    if (!res.data.items || res.data.items.length === 0) return null;

    for (const item of res.data.items) {
        const vidId = item.id.videoId;
        if (!vidId) continue;

        const video = await getVideoDetails(vidId);
        if (!video) continue;
        if (!isEligibleVideo(video)) continue;

        return `https://www.youtube.com/watch?v=${vidId}`;
    }

    return null;
}

/**
 * Bangun query rekomendasi dari info video saat ini.
 * Strategi:
 *   1. Ambil judul + nama artist pertama video saat ini → cari lagu serupa
 *   2. Bila tidak bisa resolve info video, fallback ke genre
 */
async function buildRecommendationQuery(currentVideoUrl, genre) {
    if (!currentVideoUrl) return genre;

    const videoId = extractVideoId(currentVideoUrl);
    if (!videoId) return genre;

    try {
        const video = await getVideoDetails(videoId);
        if (!video) return genre;

        const title = video.snippet.title || '';
        const channel = video.snippet.channelTitle || '';

        // Buang kata-kata noise dari judul (MV, Official, Lyrics, dst)
        const cleanTitle = title
            .replace(/\(.*?\)/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/official|mv|music video|lyrics|lyric|video|hd|4k/gi, '')
            .trim();

        // Gunakan judul bersih + channel sebagai query rekomendasi
        const query = cleanTitle ? `${cleanTitle} ${channel}`.trim() : genre;
        console.info(`[ytAuto] Query rekomendasi dari lagu saat ini: "${query}"`);
        return query;
    } catch (err) {
        console.warn(`[ytAuto] Gagal ambil info video saat ini: ${err.message}. Fallback ke genre.`);
        return genre;
    }
}

/**
 * Dapatkan URL rekomendasi lagu berikutnya.
 *
 * Strategi (tanpa relatedToVideoId yang sudah deprecated):
 *   1. Bangun query dari judul/channel video saat ini
 *   2. Cari dengan query tersebut
 *   3. Bila tidak ada hasil, fallback ke pencarian genre murni
 *
 * @param {string|null} currentVideoUrl - URL YouTube yang sedang diputar
 * @param {string} genre - genre fallback (default: 'j-pop')
 * @returns {Promise<string|null>} URL video berikutnya atau null
 */
async function getAutoRecommendation(currentVideoUrl, genre = 'j-pop') {
    if (!process.env.YOUTUBE_API_KEY) {
        console.error('[ytAuto] YOUTUBE_API_KEY tidak ditemukan di environment variables.');
        return null;
    }

    try {
        // Langkah 1: coba rekomendasi berbasis lagu saat ini
        if (currentVideoUrl) {
            const query = await buildRecommendationQuery(currentVideoUrl, genre);
            if (query !== genre) {
                const result = await searchEligibleVideo(query);
                if (result) {
                    console.info(`[ytAuto] Rekomendasi ditemukan via query judul: ${result}`);
                    return result;
                }
                console.info('[ytAuto] Tidak ada hasil dari query judul, lanjut ke fallback genre.');
            }
        }

        // Langkah 2: fallback ke pencarian genre
        const result = await searchEligibleVideo(genre);
        if (result) {
            console.info(`[ytAuto] Rekomendasi ditemukan via genre "${genre}": ${result}`);
            return result;
        }

        console.warn('[ytAuto] Tidak ada video yang memenuhi kriteria ditemukan.');
        return null;
    } catch (error) {
        console.error(`[ytAuto] Error tidak terduga: ${error.message}`);
        return null;
    }
}

module.exports = { getAutoRecommendation };
