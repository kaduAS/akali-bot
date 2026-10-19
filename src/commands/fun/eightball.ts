import { SlashCommandBuilder } from 'discord.js';
import { embed, say } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Ask the shadows something.')
		.addStringOption((o) => o.setName('question').setDescription('Your question').setRequired(true).setMaxLength(200)),
	async execute(interaction) {
		const question = interaction.options.getString('question', true);
		await interaction.reply({
			embeds: [embed().setTitle('🎱 The shadows answer').addFields({ name: 'Question', value: question }, { name: 'Answer', value: say('eightBall') })],
		});
	},
};

export default command;
