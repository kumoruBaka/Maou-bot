const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'guilds.json');

function load() {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function get(guildId, key, fallback) {
    const data = load();
    return data[guildId]?.[key] ?? fallback;
}

function set(guildId, key, value) {
    const data = load();
    if (!data[guildId]) data[guildId] = {};
    data[guildId][key] = value;
    save(data);
}

module.exports = { get, set };
