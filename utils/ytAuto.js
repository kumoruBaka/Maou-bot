const { google } = require('googleapis');
const { extractVideoId } = require('./ytScraper');

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

async function getAutoRecommendation(currentVideoUrl, genre = 'j-pop') {
    try {
        let res;
        if (currentVideoUrl) {
            const videoId = extractVideoId(currentVideoUrl);
            if (videoId) {
                res = await youtube.search.list({
                    part: 'snippet',
                    relatedToVideoId: videoId,
                    type: 'video',
                    videoCategoryId: '10', // Music category
                    maxResults: 10
                });
            }
        }

        if (!res || !res.data.items || res.data.items.length === 0) {
            res = await youtube.search.list({
                part: 'snippet',
                q: genre,
                type: 'video',
                videoCategoryId: '10', // Music category
                maxResults: 10
            });
        }

        if (!res.data.items || res.data.items.length === 0) return null;

        for (const item of res.data.items) {
            const vidId = item.id.videoId;
            
            // Get video details to check duration and live status
            const vidRes = await youtube.videos.list({
                part: 'contentDetails,snippet',
                id: vidId
            });

            if (!vidRes.data.items || vidRes.data.items.length === 0) continue;

            const video = vidRes.data.items[0];
            
            // Skip live streams
            if (video.snippet.liveBroadcastContent !== 'none') continue;

            // Parse duration (ISO 8601 format like PT3M45S)
            const durationStr = video.contentDetails.duration;
            const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) continue;

            const hours = parseInt(match[1] || 0);
            const minutes = parseInt(match[2] || 0);
            const seconds = parseInt(match[3] || 0);
            
            // Filter max 10 minutes
            if (hours > 0 || minutes > 10) continue;

            // Filter shorts (<= 60 seconds)
            if (hours === 0 && minutes === 0 && seconds <= 60) continue;

            return `https://www.youtube.com/watch?v=${vidId}`;
        }

        return null;
    } catch (error) {
        console.error('YouTube API Error:', error);
        return null;
    }
}

module.exports = { getAutoRecommendation };