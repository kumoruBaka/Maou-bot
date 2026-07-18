require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Start listen.moe WebSocket
const listenMoe = require('./listenMoeWs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

listenMoe.setClient(client);

// ─── Webhook ──────────────────────────────────────────────────────────────────

const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function sendWebhook(content, embed) {
    if (!WEBHOOK_URL) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, embeds: embed ? [embed] : undefined }),
        });
    } catch (error) {
        console.error('[webhook] Error:', error.message);
    }
}

client.on('guildCreate', guild => {
    sendWebhook(null, {
        title: '📥 Maou-sama Diundang!',
        description: `Bot telah bergabung dengan server **${guild.name}**!`,
        color: 0x00ff00,
        fields: [
            { name: 'Server ID', value: guild.id, inline: true },
            { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
        ],
        timestamp: new Date().toISOString(),
    });
});

client.on('guildDelete', guild => {
    sendWebhook(null, {
        title: '📤 Maou-sama Diusir!',
        description: `Bot telah dikeluarkan dari server **${guild.name}**!`,
        color: 0xff0000,
        fields: [{ name: 'Server ID', value: guild.id, inline: true }],
        timestamp: new Date().toISOString(),
    });
});

// ─── Crash Handler ────────────────────────────────────────────────────────────

function cleanupAndExit() {
    console.log('[index] Membersihkan voice connections...');
    client.guilds.cache.forEach(guild => {
        const connection = getVoiceConnection(guild.id);
        if (connection) connection.destroy();
    });
    process.exit(1);
}

process.on('uncaughtException', error => { console.error('[index] Uncaught Exception:', error); cleanupAndExit(); });
process.on('unhandledRejection', (reason, promise) => { console.error('[index] Unhandled Rejection at:', promise, 'reason:', reason); cleanupAndExit(); });
process.on('SIGINT', () => { console.log('[index] SIGINT diterima (Ctrl+C).'); cleanupAndExit(); });

// ─── Load Commands ────────────────────────────────────────────────────────────

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

// ─── Load Events ──────────────────────────────────────────────────────────────

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// ─── Slash Command Registration ───────────────────────────────────────────────

/**
 * Daftarkan slash commands ke Discord via REST API.
 * Menggunakan guild-scoped deployment (GUILD_ID) bila tersedia — update instan.
 * Bila GUILD_ID tidak ada, deploy global (propagasi 1 jam).
 */
async function registerSlashCommands() {
    const token     = process.env.TOKEN;
    const clientId  = process.env.CLIENT_ID;
    const guildId   = process.env.GUILD_ID; // opsional, untuk dev/test

    if (!clientId) {
        console.warn('[slash] CLIENT_ID tidak ditemukan di .env — slash commands tidak didaftarkan.');
        return;
    }

    // Kumpulkan semua command yang punya property 'data' (SlashCommandBuilder)
    const slashPayloads = [];
    for (const command of client.commands.values()) {
        if (command.data) {
            slashPayloads.push(command.data.toJSON());
        }
    }

    if (slashPayloads.length === 0) {
        console.warn('[slash] Tidak ada command dengan SlashCommandBuilder ditemukan.');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        if (guildId) {
            // Guild deploy — instan, cocok untuk development
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: slashPayloads });
            console.log(`[slash] ${slashPayloads.length} slash commands didaftarkan ke guild ${guildId}.`);
        } else {
            // Global deploy — propagasi ~1 jam
            await rest.put(Routes.applicationCommands(clientId), { body: slashPayloads });
            console.log(`[slash] ${slashPayloads.length} slash commands didaftarkan secara global.`);
        }
    } catch (error) {
        console.error('[slash] Gagal mendaftarkan slash commands:', error.message);
    }
}

// ─── Login & Register ─────────────────────────────────────────────────────────

client.once('ready', () => {
    // Daftarkan slash commands setelah client siap (CLIENT_ID bisa pakai client.user.id)
    if (!process.env.CLIENT_ID) {
        process.env.CLIENT_ID = client.user.id;
    }
    registerSlashCommands();
});

client.login(process.env.TOKEN);
