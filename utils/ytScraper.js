const fetch = require('node-fetch');
const play = require('play-dl');

const HEADERS = {
    'Origin': 'https://convertytmp3.org',
    'Referer': 'https://convertytmp3.org/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function extractVideoId(url) {
    const match = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|live\/|shorts\/)|[?&]v=)([a-zA-Z0-9-_]{11})/.exec(url);
    return match ? match[1] : null;
}

/**
 * Delay helper untuk retry backoff.
 */
function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Coba resolve YouTube video ke direct MP3 URL via epsilon API.
 * Throws dengan pesan detail bila gagal.
 */
async function scrapeYtOnce(videoId) {
    const authRes = await fetch(`https://epsilon.epsiloncloud.org/api/v1/auth?_=${Date.now()}`, { headers: HEADERS });
    if (!authRes.ok) throw new Error(`Auth HTTP ${authRes.status}`);
    const authData = await authRes.json();
    if (authData.error > 0) throw new Error(`Auth API error: code ${authData.error}`);

    const initRes = await fetch(`https://epsilon.epsiloncloud.org/api/v1/init?_=${Date.now()}`, {
        headers: { ...HEADERS, 'Authorization': `Bearer ${authData.key}` }
    });
    if (!initRes.ok) throw new Error(`Init HTTP ${initRes.status}`);
    const initData = await initRes.json();
    if (initData.error > 0) throw new Error(`Init API error: code ${initData.error}`);

    let convertURL = initData.convertURL;
    let convData;

    while (true) {
        const cUrl = `${convertURL}&v=${videoId}&f=mp3&_=${Date.now()}`;
        const cRes = await fetch(cUrl, { headers: HEADERS });
        if (!cRes.ok) throw new Error(`Convert HTTP ${cRes.status}`);
        convData = await cRes.json();
        if (convData.error > 0) throw new Error(`Convert API error: code ${convData.error}`);
        if (convData.redirect === 1) {
            convertURL = convData.redirectURL;
        } else {
            break;
        }
    }

    let downloadURL = convData.downloadURL;
    let title = convData.title;

    if (convData.progressURL) {
        while (true) {
            await delay(3000);
            const pRes = await fetch(`${convData.progressURL}&_=${Date.now()}`, { headers: HEADERS });
            if (!pRes.ok) throw new Error(`Progress HTTP ${pRes.status}`);
            const pData = await pRes.json();
            if (pData.error > 0) throw new Error(`Progress API error: code ${pData.error}`);
            if (pData.title && !title) title = pData.title;
            if (pData.progress >= 3) {
                downloadURL = pData.downloadURL || downloadURL;
                break;
            }
        }
    }

    const finalUrl = `${downloadURL}&v=${videoId}&f=mp3&r=convertytmp3.org`;
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return { url: finalUrl, title: title || 'Unknown Title', thumbnail };
}

/**
 * Fallback: gunakan play-dl untuk stream (tidak scrape direct URL).
 * Return object kompatibel dengan TrackInfo, tapi isScraped = false.
 */
async function scrapeYtFallback(videoId) {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await play.video_info(ytUrl);
    const details = info.video_details;
    return {
        url: details.url,
        title: details.title || 'Unknown Title',
        thumbnail: details.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        isScraped: false
    };
}

/**
 * Resolve YouTube videoId ke audio source.
 * Mencoba scrapeYtOnce hingga MAX_RETRIES kali.
 * Bila semua gagal, fallback ke play-dl stream URL.
 *
 * @param {string} videoId
 * @returns {Promise<{ url: string, title: string, thumbnail: string, isScraped: boolean }>}
 */
async function scrapeYt(videoId) {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await scrapeYtOnce(videoId);
            return { ...result, isScraped: true };
        } catch (err) {
            lastError = err;
            console.warn(`[ytScraper] Percobaan ${attempt}/${MAX_RETRIES} gagal untuk videoId=${videoId}: ${err.message}`);
            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS * attempt); // backoff: 1.5s, 3s
            }
        }
    }

    // Semua retry habis — coba fallback ke play-dl
    console.warn(`[ytScraper] Semua retry habis. Menggunakan fallback play-dl untuk videoId=${videoId}`);
    try {
        const fallback = await scrapeYtFallback(videoId);
        console.info(`[ytScraper] Fallback berhasil untuk videoId=${videoId}: "${fallback.title}"`);
        return fallback;
    } catch (fallbackErr) {
        // Kedua metode gagal — lempar error komprehensif
        throw new Error(
            `Gagal resolve audioId=${videoId}. ` +
            `Scraper: ${lastError.message} | Fallback: ${fallbackErr.message}`
        );
    }
}

module.exports = { scrapeYt, extractVideoId };
