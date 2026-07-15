const { ActivityType } = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,
    execute(client) {
        console.log(`Bot ${client.user.tag} online.`);
        client.user.setActivity('listen.moe', { type: ActivityType.Listening });
    },
};