import { InteractionContextType, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embed, errorEmbed } from '../../lib/akali';
import type { Command } from '../../types';

const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Create a poll with reactions.')
		.addStringOption((o) => o.setName('question').setDescription('The question').setRequired(true).setMaxLength(200))
		.addStringOption((o) => o.setName('options').setDescription('2 to 5 options separated by |').setRequired(true).setMaxLength(400))
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction) {
		const question = interaction.options.getString('question', true);
		const options = interaction.options
			.getString('options', true)
			.split('|')
			.map((option) => option.trim())
			.filter(Boolean);

		if (options.length < 2 || options.length > 5) {
			await interaction.reply({ embeds: [errorEmbed('Provide 2 to 5 options separated by |.')], flags: MessageFlags.Ephemeral });
			return;
		}

		const message = await interaction.reply({
			embeds: [
				embed()
					.setTitle(`📊 ${question}`)
					.setDescription(options.map((option, index) => `${numbers[index]} ${option}`).join('\n'))
					.setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() }),
			],
			fetchReply: true,
		});

		for (let index = 0; index < options.length; index++) {
			await message.react(numbers[index]).catch(() => null);
		}
	},
};

export default command;
