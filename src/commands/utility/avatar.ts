import { SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription("Show a member's avatar.")
		.addUserOption((o) => o.setName('member').setDescription('Member (default: you)')),
	async execute(interaction) {
		const user = interaction.options.getUser('member') ?? interaction.user;
		await interaction.reply({
			embeds: [embed().setTitle(`Avatar of ${user.username}`).setImage(user.displayAvatarURL({ size: 1024 }))],
		});
	},
};

export default command;
