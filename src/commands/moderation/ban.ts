import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed, say } from '../../lib/akali';
import { dmUser, hierarchyError, logAction } from '../../lib/moderation';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Eliminate a target from the server (ban).')
		.addUserOption((o) => o.setName('target').setDescription('Who will be banned').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Ban reason').setMaxLength(400))
		.addIntegerOption((o) =>
			o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const user = interaction.options.getUser('target', true);
		const member = interaction.options.getMember('target');
		const reason = interaction.options.getString('reason') ?? 'No reason provided';
		const days = interaction.options.getInteger('delete_days') ?? 0;

		if (member) {
			const problem = hierarchyError(interaction, member);
			if (problem) {
				await interaction.reply({ embeds: [errorEmbed(problem)], flags: MessageFlags.Ephemeral });
				return;
			}
			if (!member.bannable) {
				await interaction.reply({ embeds: [errorEmbed("My role can't reach that target.")], flags: MessageFlags.Ephemeral });
				return;
			}
		}

		await dmUser(user, `You were banned from **${interaction.guild.name}**.\nReason: ${reason}`);
		await interaction.guild.members.ban(user.id, {
			reason: `${interaction.user.tag}: ${reason}`,
			deleteMessageSeconds: days * 86_400,
		});

		await logAction(interaction.guild, { action: 'Ban', target: user, moderator: interaction.user, reason });
		await interaction.reply({ embeds: [successEmbed(`${say('success')}\n**${user.tag}** was banned. Reason: ${reason}`)] });
	},
};

export default command;
