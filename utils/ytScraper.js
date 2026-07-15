const fetch = require('node-fetch');

const HEADERS = {
    'Origin': 'https://convertytmp3.org',
    'Referer': 'https://convertytmp3.org/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

function extractVideoId(url) {
    const match = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|live\/|shorts\/)|[?&]v=)([a-zA-Z0-9-_]{11})/.exec(url);
    return match ? match[1] : null;
}

async function scrapeYt(videoId) {
    const authRes = await fetch(`https://epsilon.epsiloncloud.org/api/v1/auth?_=${Date.now()}`, { headers: HEADERS });
    const authData = await authRes.json();
    if (authData.error > 0) throw new Error('Auth failed');

    const initRes = await fetch(`https://epsilon.epsiloncloud.org/api/v1/init?_=${Date.now()}`, {
        headers: { ...HEADERS, 'Authorization': `Bearer ${authData.key}` }
    });
    const initData = await initRes.json();
    if (initData.error > 0) throw new Error('Init failed');

    let convertURL = initData.convertURL;
    let convData;
    
    while (true) {
        const cUrl = `${convertURL}&v=${videoId}&f=mp3&_=${Date.now()}`;
        const cRes = await fetch(cUrl, { headers: HEADERS });
        convData = await cRes.json();
        if (convData.error > 0) throw new Error('Convert failed');
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
            await new Promise(r => setTimeout(r, 3000));
            const pRes = await fetch(`${convData.progressURL}&_=${Date.now()}`, { headers: HEADERS });
            const pData = await pRes.json();
            if (pData.error > 0) throw new Error('Progress failed');
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

module.exports = { scrapeYt, extractVideoId };
