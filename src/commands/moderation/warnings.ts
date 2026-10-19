import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embed } from '../../lib/akali';
import { ts } from '../../lib/format';
import { prisma } from '../../lib/prisma';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('warnings')
		.setDescription("Show a member's warnings.")
		.addUserOption((o) => o.setName('target').setDescription('Member').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const user = interaction.options.getUser('target', true);
		const where = { guildId: interaction.guildId, userId: user.id };
		const [total, latest] = await Promise.all([
			prisma.warning.count({ where }),
			prisma.warning.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10 }),
		]);

		const description = latest.length
			? latest.map((w) => `**#${w.id}** • ${ts(w.createdAt)} • <@${w.moderatorId}>\n${w.reason}`).join('\n\n')
			: 'Clean record. For now.';

		await interaction.reply({
			embeds: [embed().setTitle(`Warnings for ${user.tag} (${total})`).setDescription(description)],
			flags: MessageFlags.Ephemeral,
		});
	},
};

export default command;
