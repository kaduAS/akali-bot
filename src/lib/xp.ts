import type { Message } from 'discord.js';
import { embed } from './akali';
import { getConfig, sendToChannel } from './guildConfig';
import { prisma } from './prisma';

export function xpToNext(level: number): number {
	return 5 * level * level + 50 * level + 100;
}

export function levelFromXp(totalXp: number) {
	let level = 0;
	let remaining = totalXp;
	while (remaining >= xpToNext(level)) {
		remaining -= xpToNext(level);
		level++;
	}
	return { level, current: remaining, needed: xpToNext(level) };
}

const lastGain = new Map<string, number>();

export async function handleXp(message: Message<true>): Promise<void> {
	const key = `${message.guildId}:${message.author.id}`;
	const now = Date.now();
	if (now - (lastGain.get(key) ?? 0) < 60_000) return;
	lastGain.set(key, now);

	const gain = 15 + Math.floor(Math.random() * 11);
	const where = { guildId_userId: { guildId: message.guildId, userId: message.author.id } };
	const current = await prisma.member.upsert({
		where,
		create: { guildId: message.guildId, userId: message.author.id },
		update: {},
	});

	const newXp = current.xp + gain;
	const before = levelFromXp(current.xp).level;
	const after = levelFromXp(newXp).level;

	await prisma.member.update({
		where,
		data: { xp: newXp, level: after, messages: { increment: 1 } },
	});

	if (after > before) {
		const config = await getConfig(message.guildId);
		const announce = embed()
			.setTitle('Level up!')
			.setDescription(`${message.author} reached **level ${after}**. Not bad, rookie.`);
		const sent = await sendToChannel(message.guild, config.levelUpChannelId, { embeds: [announce] });
		if (!sent && message.channel.isSendable()) {
			await message.channel.send({ embeds: [announce] }).catch(() => null);
		}
	}
}
