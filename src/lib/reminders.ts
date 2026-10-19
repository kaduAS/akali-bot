import type { Client } from 'discord.js';
import { embed } from './akali';
import { logger } from './logger';
import { prisma } from './prisma';

async function tick(client: Client): Promise<void> {
	const due = await prisma.reminder.findMany({ where: { dueAt: { lte: new Date() } }, take: 50 });
	for (const reminder of due) {
		await prisma.reminder.delete({ where: { id: reminder.id } }).catch(() => null);
		const payload = {
			content: `<@${reminder.userId}>`,
			embeds: [embed().setTitle('Reminder').setDescription(reminder.message)],
		};
		try {
			const channel = await client.channels.fetch(reminder.channelId);
			if (channel?.isSendable()) {
				await channel.send(payload);
				continue;
			}
			throw new Error('channel unavailable');
		}
		catch {
			const user = await client.users.fetch(reminder.userId).catch(() => null);
			await user?.send(payload).catch(() => null);
		}
	}
}

export function startReminderLoop(client: Client): NodeJS.Timeout {
	return setInterval(() => {
		tick(client).catch((error) => logger.error({ err: error }, 'Error in reminder loop'));
	}, 30_000);
}
