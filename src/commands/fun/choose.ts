import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embed, errorEmbed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('choose')
		.setDescription('Pick an option for you.')
		.addStringOption((o) => o.setName('options').setDescription('Options separated by commas').setRequired(true).setMaxLength(400)),
	async execute(interaction) {
		const options = interaction.options
			.getString('options', true)
			.split(',')
			.map((option) => option.trim())
			.filter(Boolean);

		if (options.length < 2) {
			await interaction.reply({ embeds: [errorEmbed('Give me at least two options, separated by commas.')], flags: MessageFlags.Ephemeral });
			return;
		}

		const pick = options[Math.floor(Math.random() * options.length)];
		await interaction.reply({ embeds: [embed().setDescription(`I choose: **${pick}**`)] });
	},
};

export default command;
