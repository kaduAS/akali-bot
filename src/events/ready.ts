import { ActivityType, Events } from 'discord.js';
import { logger } from '../lib/logger';
import { restoreRadios } from '../lib/radio';
import { startReminderLoop } from '../lib/reminders';
import { defineEvent } from '../types';

export default defineEvent({
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.info(`Akali online as ${client.user.tag}`);
		client.user.setActivity('the shadows | /help', { type: ActivityType.Watching });
		startReminderLoop(client);
		await restoreRadios(client);
	},
});
