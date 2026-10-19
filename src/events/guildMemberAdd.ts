import { Events } from 'discord.js';
import { embed, say } from '../lib/akali';
import { getConfig, sendToChannel } from '../lib/guildConfig';
import { ts } from '../lib/format';
import { defineEvent } from '../types';

export function renderTemplate(template: string, values: { user: string; server: string; count: number }): string {
	return template
		.replaceAll('{user}', values.user)
		.replaceAll('{server}', values.server)
		.replaceAll('{count}', String(values.count));
}

export default defineEvent({
	name: Events.GuildMemberAdd,
	async execute(member) {
		const config = await getConfig(member.guild.id);

		if (config.autoRoleId) {
			await member.roles.add(config.autoRoleId, 'Akali autorole').catch(() => null);
		}

		const text = renderTemplate(config.welcomeMessage, {
			user: `${member}`,
			server: member.guild.name,
			count: member.guild.memberCount,
		});

		await sendToChannel(member.guild, config.welcomeChannelId, {
			embeds: [
				embed()
					.setTitle(say('welcome'))
					.setDescription(text)
					.setThumbnail(member.user.displayAvatarURL()),
			],
		});

		await sendToChannel(member.guild, config.logChannelId, {
			embeds: [
				embed()
					.setTitle('Member joined')
					.setDescription(`${member.user} (${member.id})\nAccount created ${ts(member.user.createdAt)}`)
					.setTimestamp(),
			],
		});
	},
});
