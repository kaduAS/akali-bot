import { Events } from 'discord.js';
import { embed } from '../lib/akali';
import { getConfig, sendToChannel } from '../lib/guildConfig';
import { defineEvent } from '../types';

export default defineEvent({
	name: Events.GuildMemberRemove,
	async execute(member) {
		const config = await getConfig(member.guild.id);

		await sendToChannel(member.guild, config.goodbyeChannelId, {
			embeds: [embed().setDescription(`**${member.user.username}** left the server. The shadows go on without them.`)],
		});

		await sendToChannel(member.guild, config.logChannelId, {
			embeds: [
				embed()
					.setTitle('Member left')
					.setDescription(`${member.user.username} (${member.id})`)
					.setTimestamp(),
			],
		});
	},
});
