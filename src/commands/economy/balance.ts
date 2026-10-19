import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import { prisma } from '../../lib/prisma';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Show the coin balance.')
		.addUserOption((o) => o.setName('member').setDescription('Member (default: you)'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const user = interaction.options.getUser('member') ?? interaction.user;
		const row = await prisma.member.findUnique({
			where: { guildId_userId: { guildId: interaction.guildId, userId: user.id } },
		});
		await interaction.reply({
			embeds: [embed().setTitle(`💰 Balance of ${user.username}`).setDescription(`**${row?.balance ?? 0}** coins`)],
		});
	},
};

export default command;
