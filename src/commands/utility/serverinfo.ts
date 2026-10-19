import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import { ts } from '../../lib/format';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Show server information.')
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const guild = interaction.guild;
		await interaction.reply({
			embeds: [
				embed()
					.setTitle(guild.name)
					.setThumbnail(guild.iconURL())
					.addFields(
						{ name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
						{ name: 'Members', value: String(guild.memberCount), inline: true },
						{ name: 'Channels', value: String(guild.channels.cache.size), inline: true },
						{ name: 'Roles', value: String(guild.roles.cache.size), inline: true },
						{ name: 'Boosts', value: String(guild.premiumSubscriptionCount ?? 0), inline: true },
						{ name: 'Created', value: ts(guild.createdAt), inline: true },
					),
			],
		});
	},
};

export default command;
