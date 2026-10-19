import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, say, successEmbed } from '../../lib/akali';
import { dmUser, hierarchyError, logAction } from '../../lib/moderation';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Time out a member for a while (use 0 to remove the timeout).')
		.addUserOption((o) => o.setName('target').setDescription('Who will be timed out').setRequired(true))
		.addIntegerOption((o) =>
			o.setName('minutes').setDescription('Duration in minutes (0 removes, max 40320)').setRequired(true).setMinValue(0).setMaxValue(40_320),
		)
		.addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(400))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const member = interaction.options.getMember('target');
		const minutes = interaction.options.getInteger('minutes', true);
		const reason = interaction.options.getString('reason') ?? 'No reason provided';

		if (!member) {
			await interaction.reply({ embeds: [errorEmbed('That target is not in the server.')], flags: MessageFlags.Ephemeral });
			return;
		}

		const problem = hierarchyError(interaction, member);
		if (problem || !member.moderatable) {
			await interaction.reply({
				embeds: [errorEmbed(problem ?? "My role can't reach that target.")],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (minutes === 0) {
			await member.timeout(null, `${interaction.user.tag}: ${reason}`);
			await logAction(interaction.guild, { action: 'Untimeout', target: member.user, moderator: interaction.user, reason });
			await interaction.reply({ embeds: [successEmbed(`${say('success')}\n**${member.user.tag}** can speak again.`)] });
			return;
		}

		await member.timeout(minutes * 60_000, `${interaction.user.tag}: ${reason}`);
		await dmUser(member.user, `You were timed out in **${interaction.guild.name}** for ${minutes} min.\nReason: ${reason}`);
		await logAction(interaction.guild, {
			action: 'Timeout',
			target: member.user,
			moderator: interaction.user,
			reason,
			extra: `${minutes} minute(s)`,
		});
		await interaction.reply({
			embeds: [successEmbed(`${say('success')}\n**${member.user.tag}** timed out for ${minutes} min. Reason: ${reason}`)],
		});
	},
};

export default command;
