import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import { prisma } from '../../lib/prisma';
import { levelFromXp } from '../../lib/xp';
import type { Command } from '../../types';

const medals = ['🥇', '🥈', '🥉'];

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Show the server top 10 by XP.')
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction) {
		const top = await prisma.member.findMany({
			where: { guildId: interaction.guildId },
			orderBy: { xp: 'desc' },
			take: 10,
		});

		const description = top.length
			? top
				.map((row, index) => `${medals[index] ?? `**${index + 1}.**`} <@${row.userId}> • level ${levelFromXp(row.xp).level} • ${row.xp} XP`)
				.join('\n')
			: 'Nobody has earned XP yet. Start chatting.';

		await interaction.reply({
			embeds: [embed().setTitle(`Leaderboard of ${interaction.guild.name}`).setDescription(description)],
		});
	},
};

export default command;
