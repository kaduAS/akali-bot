import { InteractionContextType, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embed, errorEmbed, say } from '../../lib/akali';
import { ts } from '../../lib/format';
import { prisma } from '../../lib/prisma';
import type { Command } from '../../types';

const DAY = 86_400_000;

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Claim your daily coin reward.')
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const where = { guildId_userId: { guildId: interaction.guildId, userId: interaction.user.id } };
		const member = await prisma.member.upsert({
			where,
			create: { guildId: interaction.guildId, userId: interaction.user.id },
			update: {},
		});

		if (member.lastDaily && Date.now() - member.lastDaily.getTime() < DAY) {
			const next = new Date(member.lastDaily.getTime() + DAY);
			await interaction.reply({ embeds: [errorEmbed(`You already took today's loot. Come back ${ts(next)}.`)], flags: MessageFlags.Ephemeral });
			return;
		}

		const reward = 100 + Math.floor(Math.random() * 101);
		const updated = await prisma.member.update({
			where,
			data: { balance: { increment: reward }, lastDaily: new Date() },
		});

		await interaction.reply({
			embeds: [embed().setTitle('💰 Daily reward').setDescription(`${say('daily')}\n**+${reward}** coins • balance: **${updated.balance}**`)],
		});
	},
};

export default command;
