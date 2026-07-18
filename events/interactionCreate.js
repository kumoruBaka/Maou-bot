/**
 * interactionCreate.js
 *
 * Handler untuk semua ChatInputCommandInteraction (slash commands).
 * Mencari command dari client.commands menggunakan:
 *   - interaction.commandName langsung (kebanyakan command)
 *   - pemetaan slashName → name untuk command yang punya slashName
 *     (mis. 'infoauto' → 'info.auto', 'ownership-move' → 'ownership.move')
 */

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Hanya tangani slash commands
        if (!interaction.isChatInputCommand()) return;

        const slashName = interaction.commandName;

        // Cari command langsung by name
        let command = client.commands.get(slashName);

        // Kalau tidak ketemu, cari via slashName mapping
        if (!command) {
            command = client.commands.find(cmd => cmd.slashName === slashName);
        }

        if (!command) {
            console.warn(`[interactionCreate] Tidak ada command untuk slash /${slashName}`);
            return interaction.reply({
                content: 'Ugh! Perintah itu tidak ada dalam buku sihirku! 💢',
                ephemeral: true,
            });
        }

        if (typeof command.executeSlash !== 'function') {
            console.warn(`[interactionCreate] Command "${command.name}" tidak punya executeSlash()`);
            return interaction.reply({
                content: 'Hmph! Command ini belum mendukung slash command! 💢',
                ephemeral: true,
            });
        }

        try {
            await command.executeSlash(interaction);
        } catch (error) {
            console.error(`[interactionCreate] Error di /${slashName}:`, error);
            const errMsg = { content: 'Ugh! Ada kesalahan sihir yang tidak terduga! 💢', ephemeral: true };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errMsg).catch(() => {});
            } else {
                await interaction.reply(errMsg).catch(() => {});
            }
        }
    },
};
