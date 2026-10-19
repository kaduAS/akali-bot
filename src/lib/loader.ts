import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Client } from 'discord.js';
import type { BotEvent, Command } from '../types';
import { logger } from './logger';

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true })
		.flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]))
		.filter((file) => /\.(ts|js)$/.test(file) && !file.endsWith('.d.ts'));
}

async function load<T>(file: string): Promise<Partial<T>> {
	const mod = await import(file);
	return (mod.default ?? mod) as Partial<T>;
}

export async function readCommands(dir: string): Promise<Command[]> {
	const commands: Command[] = [];
	for (const file of walk(dir)) {
		const command = await load<Command>(file);
		if (command.data && command.execute) {
			commands.push(command as Command);
		}
		else {
			logger.warn(`The command at ${file} is missing "data" or "execute".`);
		}
	}
	return commands;
}

export async function loadCommands(client: Client, dir: string): Promise<void> {
	for (const command of await readCommands(dir)) {
		client.commands.set(command.data.name, command);
	}
	logger.info(`${client.commands.size} command(s) loaded.`);
}

export async function loadEvents(client: Client, dir: string): Promise<void> {
	for (const file of walk(dir)) {
		const event = await load<BotEvent>(file);
		if (!event.name || !event.execute) {
			logger.warn(`The event at ${file} is missing "name" or "execute".`);
			continue;
		}
		const execute = event.execute as (...args: unknown[]) => unknown;
		const listener = (...args: unknown[]) => {
			Promise.resolve(execute(...args)).catch((error) => logger.error({ err: error }, `Error in event ${String(event.name)}`));
		};
		if (event.once) {
			client.once(event.name as string, listener);
		}
		else {
			client.on(event.name as string, listener);
		}
	}
}
