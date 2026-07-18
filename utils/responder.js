/**
 * responder.js
 *
 * Abstraksi tipis di atas Discord.js Message dan ChatInputCommandInteraction.
 * Memungkinkan logika bisnis command tidak peduli dari mana ia dipanggil
 * (prefix `mao.` atau slash command `/`).
 *
 * Cara pakai:
 *   const r = new Responder(messageOrInteraction);
 *   await r.reply('Teks');
 *   await r.reply({ embeds: [embed] });
 *
 * Properti yang di-expose:
 *   r.guildId     — string
 *   r.userId      — string (author/user ID)
 *   r.member      — GuildMember
 *   r.channel     — TextChannel (untuk send mandiri, mis. dari playNext)
 *   r.guild       — Guild
 *   r.mentions    — MessageMentions | null
 *   r.isSlash     — boolean
 */

class Responder {
    /**
     * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} source
     */
    constructor(source) {
        this._source = source;
        this.isSlash = !source.content !== undefined
            ? ('commandName' in source)
            : true;
        // Lebih andal: periksa apakah source punya commandName (ciri Interaction)
        this.isSlash = 'commandName' in source;
        this.guildId = source.guildId ?? source.guild?.id;
        this.userId  = this.isSlash ? source.user.id : source.author.id;
        this.member  = source.member;
        this.channel = source.channel;
        this.guild   = source.guild;
        // MessageMentions hanya tersedia di prefix commands
        this.mentions = this.isSlash ? null : source.mentions;
    }

    /**
     * Kirim reply ke pengguna.
     * - Message  → message.reply()
     * - Interaction yang belum di-reply → interaction.reply()
     * - Interaction yang sudah di-reply → interaction.followUp()
     *
     * @param {string | import('discord.js').InteractionReplyOptions} content
     */
    async reply(content) {
        if (!this.isSlash) {
            return this._source.reply(content);
        }

        const opts = typeof content === 'string' ? { content, ephemeral: false } : content;

        if (this._source.deferred) {
            return this._source.editReply(opts);
        }
        if (this._source.replied) {
            return this._source.followUp(opts);
        }
        return this._source.reply(opts);
    }

    /**
     * Kirim pesan ke channel tanpa reply (dipakai di playNext untuk
     * notifikasi async yang tidak terikat interaksi awal).
     *
     * @param {string | import('discord.js').MessageCreateOptions} content
     */
    async send(content) {
        return this.channel.send(content);
    }

    /**
     * Defer reply untuk operasi yang membutuhkan waktu lama (slash only).
     * Pada prefix commands ini adalah no-op.
     */
    async defer() {
        if (this.isSlash && !this._source.deferred && !this._source.replied) {
            await this._source.deferReply();
        }
    }
}

module.exports = { Responder };
