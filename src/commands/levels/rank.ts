import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import { progressBar } from '../../lib/format';
import { prisma } from '../../lib/prisma';
import { levelFromXp } from '../../lib/xp';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription("Show a member's level and XP.")
		.addUserOption((o) => o.setName('member').setDescription('Member (default: you)'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const user = interaction.options.getUser('member') ?? interaction.user;
		const row = await prisma.member.findUnique({
			where: { guildId_userId: { guildId: interaction.guildId, userId: user.id } },
		});

		const xp = row?.xp ?? 0;
		const { level, current, needed } = levelFromXp(xp);
		const position = (await prisma.member.count({ where: { guildId: interaction.guildId, xp: { gt: xp } } })) + 1;

		await interaction.reply({
			embeds: [
				embed()
					.setTitle(`Rank of ${user.username}`)
					.setThumbnail(user.displayAvatarURL())
					.addFields(
						{ name: 'Position', value: `#${position}`, inline: true },
						{ name: 'Level', value: String(level), inline: true },
						{ name: 'Total XP', value: String(xp), inline: true },
						{ name: `Progress (${current}/${needed})`, value: progressBar(current, needed) },
					),
			],
		});
	},
};

export default command;
