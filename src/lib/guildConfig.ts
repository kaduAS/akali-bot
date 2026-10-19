import type { GuildConfig, Prisma } from '@prisma/client';
import type { Guild, MessageCreateOptions } from 'discord.js';
import { prisma } from './prisma';

const TTL = 30_000;
const cache = new Map<string, { value: GuildConfig; at: number }>();

export async function getConfig(guildId: string): Promise<GuildConfig> {
	const hit = cache.get(guildId);
	if (hit && Date.now() - hit.at < TTL) return hit.value;

	const value = await prisma.guildConfig.upsert({
		where: { guildId },
		create: { guildId },
		update: {},
	});
	cache.set(guildId, { value, at: Date.now() });
	return value;
}

export async function updateConfig(guildId: string, data: Prisma.GuildConfigUpdateInput): Promise<GuildConfig> {
	await getConfig(guildId);
	const value = await prisma.guildConfig.update({ where: { guildId }, data });
	cache.set(guildId, { value, at: Date.now() });
	return value;
}

export async function sendToChannel(guild: Guild, channelId: string | null | undefined, options: MessageCreateOptions) {
	if (!channelId) return null;
	const channel = guild.channels.cache.get(channelId);
	if (!channel || !channel.isSendable()) return null;
	return channel.send(options).catch(() => null);
}
