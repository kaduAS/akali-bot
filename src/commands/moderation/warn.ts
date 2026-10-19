import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, say, successEmbed } from '../../lib/akali';
import { applyWarning, dmUser, hierarchyError, logAction } from '../../lib/moderation';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a member. At the limit, they are timed out automatically.')
		.addUserOption((o) => o.setName('target').setDescription('Who will receive the warning').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Warning reason').setRequired(true).setMaxLength(400))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const member = interaction.options.getMember('target');
		const reason = interaction.options.getString('reason', true);

		if (!member) {
			await interaction.reply({ embeds: [errorEmbed('That target is not in the server.')], flags: MessageFlags.Ephemeral });
			return;
		}

		const problem = hierarchyError(interaction, member);
		if (problem) {
			await interaction.reply({ embeds: [errorEmbed(problem)], flags: MessageFlags.Ephemeral });
			return;
		}

		const result = await applyWarning(interaction.guild, member, interaction.user.id, reason);
		const suffix = result.timedOut ? `\nLimit reached: timed out for ${result.muteMinutes} min.` : '';

		await dmUser(member.user, `You received a warning in **${interaction.guild.name}**.\nReason: ${reason}${suffix}`);
		await logAction(interaction.guild, {
			action: 'Warn',
			target: member.user,
			moderator: interaction.user,
			reason,
			extra: `Total warnings: ${result.count}`,
		});
		await interaction.reply({
			embeds: [successEmbed(`${say('success')}\n**${member.user.tag}** warned (total: ${result.count}).${suffix}`)],
		});
	},
};

export default command;
