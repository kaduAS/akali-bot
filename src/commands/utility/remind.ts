import { InteractionContextType, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed } from '../../lib/akali';
import { ts } from '../../lib/format';
import { prisma } from '../../lib/prisma';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Create a reminder.')
		.addIntegerOption((o) =>
			o.setName('minutes').setDescription('In how many minutes (max 10080 = 7 days)').setRequired(true).setMinValue(1).setMaxValue(10_080),
		)
		.addStringOption((o) => o.setName('message').setDescription('What to remind you of').setRequired(true).setMaxLength(300))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const minutes = interaction.options.getInteger('minutes', true);
		const message = interaction.options.getString('message', true);
		const dueAt = new Date(Date.now() + minutes * 60_000);

		await prisma.reminder.create({
			data: { userId: interaction.user.id, channelId: interaction.channelId, message, dueAt },
		});
		await interaction.reply({ embeds: [successEmbed(`Noted. I'll remind you ${ts(dueAt)}.`)], flags: MessageFlags.Ephemeral });
	},
};

export default command;
