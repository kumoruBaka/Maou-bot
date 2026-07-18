const listenMoe = require('../listenMoeWs');

module.exports = {
    name: 'info.auto',
    execute(message) {
        const isEnabled = listenMoe.toggleAutoInfo(message.channel.id, message.guild.id);
        
        if (isEnabled) {
            message.reply('Fufufu~ Sihir pengintai otomatis diaktifkan! Maou-sama akan memberitahumu setiap kali lagu berganti di channel ini! 📻✨');
        } else {
            message.reply('Cih, baiklah. Sihir pengintai otomatis dimatikan. Jangan merengek kalau kamu ketinggalan info lagu! 😤');
        }
    },
};