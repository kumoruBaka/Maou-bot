const langs = require('../langStore');

module.exports = {
    name: 'lang',
    execute(message, args) {
        const lang = args[0]?.toUpperCase();
        if (!['ID', 'EN', 'JP'].includes(lang)) {
            return message.reply('Hmph! Bahasa tidak valid. Pilih ID, EN, atau JP. 💢');
        }
        langs.set(message.guild.id, lang);
        
        const replies = {
            ID: 'Fufufu~ Bahasa diubah ke Indonesia! ✨',
            EN: 'Fufufu~ Language changed to English! ✨',
            JP: 'ふふふ〜 言語を日本語に変更しました！ ✨'
        };
        
        message.reply(replies[lang]);
    },
};
