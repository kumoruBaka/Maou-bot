const { SlashCommandBuilder } = require('discord.js');
const langs = require('../langStore');
const { Responder } = require('../utils/responder');

const VALID_LANGS = ['ID', 'EN', 'JP'];

const replies = {
    ID: 'Fufufu~ Bahasa diubah ke Indonesia! ✨',
    EN: 'Fufufu~ Language changed to English! ✨',
    JP: 'ふふふ〜 言語を日本語に変更しました！ ✨',
};

function executeLogic(r, lang) {
    if (!VALID_LANGS.includes(lang)) {
        return r.reply('Hmph! Bahasa tidak valid. Pilih ID, EN, atau JP. 💢');
    }
    langs.set(r.guildId, lang);
    r.reply(replies[lang]);
}

module.exports = {
    name: 'lang',
    data: new SlashCommandBuilder()
        .setName('lang')
        .setDescription('Ubah bahasa respons bot untuk server ini')
        .addStringOption(opt =>
            opt.setName('bahasa')
                .setDescription('Pilih bahasa')
                .setRequired(true)
                .addChoices(
                    { name: 'Indonesia', value: 'ID' },
                    { name: 'English', value: 'EN' },
                    { name: '日本語', value: 'JP' }
                )),

    execute(message, args) {
        executeLogic(new Responder(message), args[0]?.toUpperCase());
    },
    executeSlash(interaction) {
        executeLogic(new Responder(interaction), interaction.options.getString('bahasa'));
    },
};
