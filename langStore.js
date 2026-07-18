const store = require('./storage/store');

// ponytail: Map interface dipertahankan agar semua consumer tidak perlu diubah
const langs = {
    get(guildId) {
        return store.get(guildId, 'lang', 'ID');
    },
    set(guildId, lang) {
        store.set(guildId, 'lang', lang);
    },
    has(guildId) {
        return !!store.get(guildId, 'lang', null);
    },
};

module.exports = langs;
