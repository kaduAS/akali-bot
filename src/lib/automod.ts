import type { GuildConfig } from '@prisma/client';
import { PermissionFlagsBits, type Message } from 'discord.js';
import { errorEmbed } from './akali';
import { logger } from './logger';
import { applyWarning, logAction } from './moderation';

const INVITE = /(discord\.gg|discord(app)?\.com\/invite)\/[\w-]+/i;
const LINK = /https?:\/\/\S+/i;
const spam = new Map<string, number[]>();

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isShouting(content: string): boolean {
	const letters = content.replace(/[^a-zA-ZÀ-ÿ]/g, '');
	if (letters.length < 10) return false;
	const upper = letters.replace(/[^A-ZÀ-Þ]/g, '').length;
	return upper / letters.length > 0.7;
}

function hasBadWord(content: string, words: string[]): boolean {
	return words.some((word) => new RegExp(`(^|[^\\p{L}])${escapeRegex(word)}($|[^\\p{L}])`, 'iu').test(content));
}

function isSpamming(message: Message<true>): boolean {
	const key = `${message.guildId}:${message.author.id}`;
	const now = Date.now();
	const recent = (spam.get(key) ?? []).filter((time) => now - time < 5_000);
	recent.push(now);
	spam.set(key, recent);
	if (recent.length >= 5) {
		spam.delete(key);
		return true;
	}
	return false;
}

export async function runAutomod(message: Message<true>, config: GuildConfig): Promise<boolean> {
	const member = message.member;
	if (!member || member.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

	const content = message.content;
	let reason: string | null = null;

	if (config.blockInvites && INVITE.test(content)) reason = 'invite to another server';
	else if (config.blockLinks && LINK.test(content)) reason = 'unauthorized link';
	else if (config.blockCaps && isShouting(content)) reason = 'excessive caps';
	else if (config.badWords.length > 0 && hasBadWord(content, config.badWords)) reason = 'banned word';
	else if (config.blockSpam && isSpamming(message)) reason = 'spam';

	if (!reason) return false;

	await message.delete().catch((error) => logger.debug({ err: error }, 'Failed to delete message in automod'));

	const result = await applyWarning(message.guild, member, message.client.user.id, `Automod: ${reason}`);
	const suffix = result.timedOut ? ` Timed out for ${result.muteMinutes} min.` : '';

	if (message.channel.isSendable()) {
		const notice = await message.channel
			.send({ embeds: [errorEmbed(`${message.author}, your message was removed: **${reason}**. (warning ${result.count})${suffix}`)] })
			.catch(() => null);
		setTimeout(() => notice?.delete().catch(() => null), 8_000);
	}

	await logAction(message.guild, {
		action: 'Automod',
		target: message.author,
		moderator: message.client.user,
		reason,
		extra: content.slice(0, 500) || '(no text)',
	});
	return true;
}
