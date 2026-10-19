import { Events } from 'discord.js';
import { runAutomod } from '../lib/automod';
import { getConfig } from '../lib/guildConfig';
import { logger } from '../lib/logger';
import { handleXp } from '../lib/xp';
import { defineEvent } from '../types';

export default defineEvent({
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot || !message.inGuild()) return;

		try {
			const config = await getConfig(message.guildId);
			if (config.automodEnabled && (await runAutomod(message, config))) return;
			if (config.levelsEnabled) await handleXp(message);
		}
		catch (error) {
			logger.error({ err: error }, 'Error processing message');
		}
	},
});
