import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import { truncate, ts } from '../../lib/format';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Show information about a member.')
		.addUserOption((o) => o.setName('member').setDescription('Member (default: you)'))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const member = interaction.options.getMember('member') ?? interaction.member;
		const roles = member.roles.cache
			.filter((role) => role.id !== interaction.guildId)
			.sort((a, b) => b.position - a.position)
			.first(10)
			.map((role) => `${role}`);

		await interaction.reply({
			embeds: [
				embed()
					.setTitle(member.user.tag)
					.setThumbnail(member.displayAvatarURL())
					.addFields(
						{ name: 'ID', value: member.id, inline: true },
						{ name: 'Account created', value: ts(member.user.createdAt), inline: true },
						{ name: 'Joined server', value: ts(member.joinedAt), inline: true },
						{ name: 'Roles', value: truncate(roles.join(' ') || 'none', 1000) },
					),
			],
		});
	},
};

export default command;
