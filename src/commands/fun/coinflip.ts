import { SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin.'),
	async execute(interaction) {
		const heads = Math.random() < 0.5;
		await interaction.reply({ embeds: [embed().setDescription(heads ? '🪙 **Heads!**' : '🪙 **Tails!**')] });
	},
};

export default command;
