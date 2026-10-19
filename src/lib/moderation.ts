import type { ChatInputCommandInteraction, Guild, GuildMember, User } from 'discord.js';
import { embed } from './akali';
import { getConfig, sendToChannel } from './guildConfig';
import { prisma } from './prisma';

export function hierarchyError(interaction: ChatInputCommandInteraction<'cached'>, target: GuildMember): string | null {
	if (target.id === interaction.user.id) return 'Targeting yourself? Pick another target.';
	if (target.id === interaction.client.user.id) return "I won't target myself.";
	if (target.id === interaction.guild.ownerId) return 'The server owner is untouchable.';

	const invokerIsOwner = interaction.user.id === interaction.guild.ownerId;
	const higher = target.roles.highest.position >= interaction.member.roles.highest.position;
	if (!invokerIsOwner && higher) return 'That target is at (or above) your role level.';
	return null;
}

export async function dmUser(user: User, text: string): Promise<void> {
	await user.send({ embeds: [embed().setDescription(text)] }).catch(() => null);
}

interface LogOptions {
	action: string;
	target: User;
	moderator: User;
	reason: string;
	extra?: string;
}

export async function logAction(guild: Guild, options: LogOptions): Promise<void> {
	const config = await getConfig(guild.id);
	const log = embed()
		.setTitle(`Action: ${options.action}`)
		.addFields(
			{ name: 'Target', value: `${options.target} (${options.target.id})`, inline: true },
			{ name: 'Moderator', value: `${options.moderator}`, inline: true },
			{ name: 'Reason', value: options.reason.slice(0, 1000) },
		)
		.setTimestamp();
	if (options.extra) log.addFields({ name: 'Details', value: options.extra });
	await sendToChannel(guild, config.logChannelId, { embeds: [log] });
}

export async function applyWarning(guild: Guild, member: GuildMember, moderatorId: string, reason: string) {
	await prisma.warning.create({
		data: { guildId: guild.id, userId: member.id, moderatorId, reason },
	});
	const count = await prisma.warning.count({ where: { guildId: guild.id, userId: member.id } });
	const config = await getConfig(guild.id);

	let timedOut = false;
	if (count % config.maxWarnsBeforeMute === 0 && member.moderatable) {
		await member.timeout(config.muteMinutes * 60_000, `Warning limit of ${config.maxWarnsBeforeMute} reached`).catch(() => null);
		timedOut = true;
	}
	return { count, timedOut, muteMinutes: config.muteMinutes };
}
