require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');

// Start listen.moe WebSocket
const listenMoe = require('./listenMoeWs');

// Intent untuk baca pesan dan masuk voice
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

listenMoe.setClient(client);

// Webhook URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1526876596395315200/d51eEj7tES-CdzMKe0hcfmlxrL6vxT-uCx_Wk3BQeGPqoc17YsOEBa6b7UJ55n76ZZy9';

async function sendWebhook(content, embed) {
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, embeds: embed ? [embed] : undefined })
        });
    } catch (error) {
        console.error('Webhook error:', error);
    }
}

// Event saat bot di-invite ke server baru
client.on('guildCreate', guild => {
    sendWebhook(null, {
        title: '📥 Maou-sama Diundang!',
        description: `Bot telah bergabung dengan server **${guild.name}**!`,
        color: 0x00ff00,
        fields: [
            { name: 'Server ID', value: guild.id, inline: true },
            { name: 'Member Count', value: guild.memberCount.toString(), inline: true }
        ],
        timestamp: new Date().toISOString()
    });
});

// Event saat bot di-kick dari server
client.on('guildDelete', guild => {
    sendWebhook(null, {
        title: '📤 Maou-sama Diusir!',
        description: `Bot telah dikeluarkan dari server **${guild.name}**!`,
        color: 0xff0000,
        fields: [
            { name: 'Server ID', value: guild.id, inline: true }
        ],
        timestamp: new Date().toISOString()
    });
});

// Web Server Setup
const app = express();
const PORT = 3212;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        currentSong: listenMoe.getCurrentSong()
    });
});

app.listen(PORT, () => {
    console.log(`Web server berjalan di http://localhost:${PORT}`);
});

// Crash handler supaya bot tidak nyangkut di voice channel
function cleanupAndExit() {
    console.log('Membersihkan voice connections...');
    client.guilds.cache.forEach(guild => {
        const connection = getVoiceConnection(guild.id);
        if (connection) {
            connection.destroy();
        }
    });
    process.exit(1);
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    cleanupAndExit();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    cleanupAndExit();
});

process.on('SIGINT', () => {
    console.log('SIGINT diterima (Ctrl+C).');
    cleanupAndExit();
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(process.env.TOKEN);