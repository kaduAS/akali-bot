# Akali — a Discord bot to organize your server

A free, open-source Discord bot with the personality of Akali, the Rogue Assassin from League of Legends. You run it **on your own computer**, with no subscription.

- **Moderation and automod**, MEE6-style: ban, kick, timeout, warnings, chat purge, and filters for invites, links, CAPS, spam and banned words.
- **Levels and leaderboard** powered by message XP.
- **Lofi radio** in a voice channel that comes back on its own when the bot restarts.
- **Fun and utility commands**, BMO-style: 8ball, dice, polls, a coin economy, reminders and more.
- **Welcome, goodbye, autorole and logs**, configurable per server.

> This project is not affiliated with Riot Games, MEE6, BMO or Lofi Radio. Akali is a League of Legends character; the bot only borrows the theme.

**Stack:** Node.js · TypeScript · discord.js v14 · @discordjs/voice + FFmpeg · PostgreSQL · Prisma · Zod · Pino · Docker · GitHub Actions.

## Commands

| Area | Commands |
|---|---|
| Moderation | `/ban` `/unban` `/kick` `/timeout` `/warn` `/warnings` `/clearwarns` `/purge` `/slowmode` |
| Configuration | `/setup logs`, `welcome`, `goodbye`, `autorole`, `automod`, `word`, `levels`, `disable`, `view` |
| Levels | `/rank` `/leaderboard` |
| Radio | `/lofi play` `/lofi stop` `/lofi volume` `/lofi status` |
| Fun | `/8ball` `/coinflip` `/roll` `/choose` `/poll` |
| Economy | `/daily` `/balance` `/pay` |
| Utility | `/ping` `/avatar` `/userinfo` `/serverinfo` `/remind` `/help` |

Automod handles invites, links, CAPS, spam (5 messages in 5 seconds) and banned words. Each violation becomes a warning; when a member reaches the configured limit they are timed out automatically. Members with the Manage Messages permission are ignored.

## Run it on your computer

Everyone creates **their own bot** in Discord (it's free) and runs it locally. The bot is only online while your computer is on and Docker is running.

### 1. Install

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, Mac or Linux)
- [Git](https://git-scm.com)

### 2. Create your bot in Discord

1. Open the [Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Under **General Information**, copy the **Application ID**.
3. Under **Bot**, click **Reset Token** and copy the token. Keep it secret.
4. Still under **Bot > Privileged Gateway Intents**, enable **Server Members Intent** and **Message Content Intent**, then save.
5. Under **OAuth2 > URL Generator**, select the scopes `bot` and `applications.commands`. For permissions, pick *Administrator*, or: Manage Roles, Kick Members, Ban Members, Moderate Members, Manage Messages, Manage Channels, Send Messages, Embed Links, Add Reactions, Connect, Speak.
6. Open the generated link and add the bot to your server.
7. In your server settings, drag the bot's role **above** the roles it will moderate.

### 3. Download and configure

```bash
git clone https://github.com/kaduAS/akali-bot.git
cd akali-bot
cp .env.example .env     # Windows (cmd): copy .env.example .env
```

Open `.env` and fill in:

- `DISCORD_TOKEN` with the token from step 2.
- `DISCORD_CLIENT_ID` with the Application ID.
- `DEV_GUILD_ID` (optional) with your server ID. To copy it: Discord Settings > Advanced > Developer Mode, then right-click the server icon > Copy Server ID. With it, commands appear instantly; without it, they are registered globally.

### 4. Start it

```bash
docker compose up -d --build
docker compose logs -f bot
```

When you see **"Akali online as ..."**, it's working. Press `Ctrl+C` to leave the logs; the bot keeps running.

Useful commands:

```bash
docker compose stop            # turn the bot off (your data is kept)
docker compose up -d           # turn it back on
docker compose logs -f bot     # view logs
git pull && docker compose up -d --build   # update to the latest version
```

### 5. First steps in your server

```
/setup logs channel:#logs
/setup welcome channel:#welcome
/setup automod enabled:true
/lofi play            (join a voice channel first)
/help
```

## Run without Docker (for development)

You need Node.js 22+, FFmpeg and a PostgreSQL database.

```bash
cp .env.example .env          # fill it in, including DATABASE_URL
npm install
npx prisma db push            # create the tables
npm run deploy:commands       # register the slash commands
npm run dev
```

Scripts: `npm run lint`, `npm run typecheck`, `npm run build`.

## Environment variables

| Name | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `DISCORD_CLIENT_ID` | Application ID |
| `DEV_GUILD_ID` | Optional. Server for instant slash command registration |
| `POSTGRES_PASSWORD` | Password for the database created by Docker (default `akali`) |
| `DATABASE_URL` | Only needed when running without Docker |
| `LOFI_STREAM_URL` | Radio stream URL. Default: SomaFM Groove Salad. Only use streams you have the right to use |
| `PORT` | Health check port (`/health`) |

## Security

- **Never** publish your `.env` or your token. The `.gitignore` already blocks it, but double-check before every commit.
- If your token leaks, click **Reset Token** in the Developer Portal right away.

## Project structure

```
src/
  commands/   one file per slash command, grouped by category
  events/     one file per Discord event
  lib/        automod, xp, radio, reminders, per-server config, persona
prisma/       database schema
```

To add a command, create a file in `src/commands/<category>/` that default-exports an object with `data` and `execute`.

## Contributing

Issues and pull requests are welcome. Before opening a PR, run `npm run lint` and `npm run typecheck`.

## License

[MIT](LICENSE)
