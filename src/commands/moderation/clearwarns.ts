import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { say, successEmbed } from '../../lib/akali';
import { logAction } from '../../lib/moderation';
import { prisma } from '../../lib/prisma';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('clearwarns')
		.setDescription("Clear all of a member's warnings.")
		.addUserOption((o) => o.setName('target').setDescription('Member').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const user = interaction.options.getUser('target', true);
		const { count } = await prisma.warning.deleteMany({
			where: { guildId: interaction.guildId, userId: user.id },
		});

		await logAction(interaction.guild, {
			action: 'Clear warnings',
			target: user,
			moderator: interaction.user,
			reason: `${count} warning(s) removed`,
		});
		await interaction.reply({ embeds: [successEmbed(`${say('success')}\n${count} warning(s) for **${user.tag}** removed.`)] });
	},
};

export default command;
