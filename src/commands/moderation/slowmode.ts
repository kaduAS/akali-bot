import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, successEmbed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('slowmode')
		.setDescription('Set slowmode for the current channel.')
		.addIntegerOption((o) =>
			o.setName('seconds').setDescription('Seconds between messages (0 disables, max 21600)').setRequired(true).setMinValue(0).setMaxValue(21_600),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const channel = interaction.channel;
		if (!channel || !('setRateLimitPerUser' in channel)) {
			await interaction.reply({ embeds: [errorEmbed("This channel doesn't support slowmode.")], flags: MessageFlags.Ephemeral });
			return;
		}

		const seconds = interaction.options.getInteger('seconds', true);
		await channel.setRateLimitPerUser(seconds, `Slowmode by ${interaction.user.tag}`);
		await interaction.reply({
			embeds: [successEmbed(seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to ${seconds}s.`)],
		});
	},
};

export default command;
