 
# Maou-bot

A simple and lightweight Discord music bot featuring YouTube/SoundCloud playback, 24/7 JPOP radio (listen.moe), and a built-in web dashboard.

## Features
-  Play music from YouTube and SoundCloud
-  24/7 JPOP Radio streaming via listen.moe
-  Multi-language support (English, Indonesian, Japanese)
-  Built-in web dashboard for bot status
-  Session ownership system

## Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [FFmpeg](https://ffmpeg.org/) (required for audio playback)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kumoruBaka/Maou-bot.git
   cd Maou-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Discord bot token:
   ```env
   TOKEN=your_discord_bot_token_here
   ```

## Usage

Start the bot:
```bash
npm start
```
The web dashboard will be available at `http://localhost:3212`.

## Commands

Prefix: `mao.`

- `mao.play <url/title>` - Play a song from YouTube or SoundCloud
- `mao.stream` - Play listen.moe JPOP radio
- `mao.stop` - Stop playback and clear queue
- `mao.skip` - Skip the current song
- `mao.pause` / `mao.resume` - Pause or resume playback
- `mao.loop` - Toggle loop for the current song
- `mao.queue` - Show the current music queue
- `mao.lang <ID/EN/JP>` - Change bot language
- `mao.help` - Show all available commands

## License
[MIT](LICENSE)