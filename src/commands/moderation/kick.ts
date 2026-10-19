import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, say, successEmbed } from '../../lib/akali';
import { dmUser, hierarchyError, logAction } from '../../lib/moderation';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member from the server.')
		.addUserOption((o) => o.setName('target').setDescription('Who will be kicked').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Kick reason').setMaxLength(400))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const member = interaction.options.getMember('target');
		const reason = interaction.options.getString('reason') ?? 'No reason provided';

		if (!member) {
			await interaction.reply({ embeds: [errorEmbed('That target is not in the server.')], flags: MessageFlags.Ephemeral });
			return;
		}

		const problem = hierarchyError(interaction, member);
		if (problem || !member.kickable) {
			await interaction.reply({
				embeds: [errorEmbed(problem ?? "My role can't reach that target.")],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await dmUser(member.user, `You were kicked from **${interaction.guild.name}**.\nReason: ${reason}`);
		await member.kick(`${interaction.user.tag}: ${reason}`);

		await logAction(interaction.guild, { action: 'Kick', target: member.user, moderator: interaction.user, reason });
		await interaction.reply({ embeds: [successEmbed(`${say('success')}\n**${member.user.tag}** was kicked. Reason: ${reason}`)] });
	},
};

export default command;
