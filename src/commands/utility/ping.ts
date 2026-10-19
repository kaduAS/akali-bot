import { SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder().setName('ping').setDescription("Measure Akali's latency."),
	cooldown: 5,
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pong?', fetchReply: true });
		const latency = sent.createdTimestamp - interaction.createdTimestamp;
		await interaction.editReply({
			content: '',
			embeds: [embed().setTitle('Pong!').setDescription(`Response: **${latency}ms** • Gateway: **${interaction.client.ws.ping}ms**`)],
		});
	},
};

export default command;
