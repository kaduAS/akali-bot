import { Events } from 'discord.js';
import { embed } from '../lib/akali';
import { truncate } from '../lib/format';
import { getConfig, sendToChannel } from '../lib/guildConfig';
import { defineEvent } from '../types';

export default defineEvent({
	name: Events.MessageDelete,
	async execute(message) {
		if (!message.inGuild() || message.author?.bot) return;
		const config = await getConfig(message.guildId);

		await sendToChannel(message.guild, config.logChannelId, {
			embeds: [
				embed()
					.setTitle('Message deleted')
					.addFields(
						{ name: 'Author', value: message.author ? `${message.author}` : 'unknown', inline: true },
						{ name: 'Channel', value: `${message.channel}`, inline: true },
						{ name: 'Content', value: truncate(message.content || '(no cached text)', 1000) },
					)
					.setTimestamp(),
			],
		});
	},
});
