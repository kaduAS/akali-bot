import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { join } from 'node:path';
import { readCommands } from './lib/loader';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DEV_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
	console.error('Set DISCORD_TOKEN and DISCORD_CLIENT_ID in .env');
	process.exit(1);
}

const useGlobal = process.argv.includes('--global');

async function main(): Promise<void> {
	const commands = (await readCommands(join(__dirname, 'commands'))).map((command) => command.data.toJSON());
	const rest = new REST().setToken(DISCORD_TOKEN as string);

	console.log(`Registering ${commands.length} slash command(s)...`);

	if (useGlobal || !DEV_GUILD_ID) {
		await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID as string), { body: commands });
		console.log('Commands registered globally (may take up to 1h to appear in every server).');
	}
	else {
		await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID as string, DEV_GUILD_ID), { body: commands });
		console.log(`Commands registered in server ${DEV_GUILD_ID}.`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
