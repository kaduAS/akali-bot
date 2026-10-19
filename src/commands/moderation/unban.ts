import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, say, successEmbed } from '../../lib/akali';
import { logAction } from '../../lib/moderation';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription("Remove a user's ban.")
		.addStringOption((o) => o.setName('id').setDescription('ID of the banned user').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Reason').setMaxLength(400))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const id = interaction.options.getString('id', true).trim();
		const reason = interaction.options.getString('reason') ?? 'No reason provided';

		const ban = await interaction.guild.bans.fetch(id).catch(() => null);
		if (!ban) {
			await interaction.reply({ embeds: [errorEmbed("I couldn't find that ID in the ban list.")], flags: MessageFlags.Ephemeral });
			return;
		}

		await interaction.guild.members.unban(id, `${interaction.user.tag}: ${reason}`);
		await logAction(interaction.guild, { action: 'Unban', target: ban.user, moderator: interaction.user, reason });
		await interaction.reply({ embeds: [successEmbed(`${say('success')}\n**${ban.user.tag}** has been pardoned.`)] });
	},
};

export default command;
