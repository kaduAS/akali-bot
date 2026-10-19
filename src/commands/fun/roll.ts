import { SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll dice.')
		.addIntegerOption((o) => o.setName('dice').setDescription('Number of dice (1-20)').setMinValue(1).setMaxValue(20))
		.addIntegerOption((o) => o.setName('sides').setDescription('Sides per die (2-1000)').setMinValue(2).setMaxValue(1000)),
	async execute(interaction) {
		const dice = interaction.options.getInteger('dice') ?? 1;
		const sides = interaction.options.getInteger('sides') ?? 6;
		const rolls = Array.from({ length: dice }, () => 1 + Math.floor(Math.random() * sides));
		const total = rolls.reduce((sum, value) => sum + value, 0);

		await interaction.reply({
			embeds: [embed().setTitle(`🎲 ${dice}d${sides}`).setDescription(`Results: ${rolls.join(', ')}\n**Total: ${total}**`)],
		});
	},
};

export default command;
