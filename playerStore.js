// Shared Map: guildId -> { player: AudioPlayer, ownerId: string, queue: Array, loop: boolean, currentTrack: Object, isRadio: boolean }
// Dipakai stream.js, stop.js, leave.js, move.js, play.js, skip.js, loop.js
const players = new Map();
module.exports = players;