import { InteractionContextType, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, successEmbed } from '../../lib/akali';
import { prisma } from '../../lib/prisma';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('pay')
		.setDescription('Transfer coins to another member.')
		.addUserOption((o) => o.setName('member').setDescription('Who receives').setRequired(true))
		.addIntegerOption((o) => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const target = interaction.options.getUser('member', true);
		const amount = interaction.options.getInteger('amount', true);

		if (target.bot || target.id === interaction.user.id) {
			await interaction.reply({ embeds: [errorEmbed('Invalid transfer target.')], flags: MessageFlags.Ephemeral });
			return;
		}

		const guildId = interaction.guildId;
		const ok = await prisma.$transaction(async (tx) => {
			const debit = await tx.member.updateMany({
				where: { guildId, userId: interaction.user.id, balance: { gte: amount } },
				data: { balance: { decrement: amount } },
			});
			if (debit.count === 0) return false;

			await tx.member.upsert({
				where: { guildId_userId: { guildId, userId: target.id } },
				create: { guildId, userId: target.id, balance: amount },
				update: { balance: { increment: amount } },
			});
			return true;
		});

		if (!ok) {
			await interaction.reply({ embeds: [errorEmbed('Insufficient balance.')], flags: MessageFlags.Ephemeral });
			return;
		}

		await interaction.reply({ embeds: [successEmbed(`${interaction.user} sent **${amount}** coins to ${target}.`)] });
	},
};

export default command;
