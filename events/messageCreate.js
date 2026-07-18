const prefix = process.env.PREFIX || 'mao.';

module.exports = {
    name: 'messageCreate',
    execute(message, client) {
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const content = message.content.slice(prefix.length).trim();
        const parts = content.split(/ +/);

        // Coba match command name terpanjang dulu (handle nama dengan titik: info.auto, ownership.move)
        let command, commandName;
        if (parts.length >= 2) {
            const twoWord = (parts[0] + '.' + parts[1]).toLowerCase();
            command = client.commands.get(twoWord);
            if (command) {
                commandName = twoWord;
                parts.splice(0, 2);
            }
        }
        if (!command) {
            commandName = parts.shift().toLowerCase();
            command = client.commands.get(commandName);
        }
        const args = parts;

        if (!command) return;

        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply('Error eksekusi command.');
        }
    },
};