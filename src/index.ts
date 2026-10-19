import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { join } from 'node:path';
import { env } from './config';
import { startHealthServer } from './health';
import { loadCommands, loadEvents } from './lib/loader';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { stopAllRadios } from './lib/radio';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();
client.cooldowns = new Collection();

async function shutdown(signal: string): Promise<void> {
	logger.info(`${signal} received, shutting down...`);
	stopAllRadios();
	await client.destroy();
	await prisma.$disconnect();
	process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => logger.error({ err: reason }, 'unhandledRejection'));
process.on('uncaughtException', (error) => logger.error({ err: error }, 'uncaughtException'));

async function main(): Promise<void> {
	await loadCommands(client, join(__dirname, 'commands'));
	await loadEvents(client, join(__dirname, 'events'));
	await prisma.$connect();
	startHealthServer(client);
	await client.login(env.DISCORD_TOKEN);
}

main().catch((error) => {
	logger.fatal({ err: error }, 'Failed to start the bot');
	process.exit(1);
});
