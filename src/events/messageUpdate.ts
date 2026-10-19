import { Events } from 'discord.js';
import { embed } from '../lib/akali';
import { truncate } from '../lib/format';
import { getConfig, sendToChannel } from '../lib/guildConfig';
import { defineEvent } from '../types';

export default defineEvent({
	name: Events.MessageUpdate,
	async execute(oldMessage, newMessage) {
		if (!newMessage.inGuild() || newMessage.author?.bot) return;
		if (!oldMessage.content || oldMessage.content === newMessage.content) return;
		const config = await getConfig(newMessage.guildId);

		await sendToChannel(newMessage.guild, config.logChannelId, {
			embeds: [
				embed()
					.setTitle('Message edited')
					.addFields(
						{ name: 'Author', value: `${newMessage.author}`, inline: true },
						{ name: 'Channel', value: `${newMessage.channel}`, inline: true },
						{ name: 'Before', value: truncate(oldMessage.content, 1000) },
						{ name: 'After', value: truncate(newMessage.content ?? '', 1000) },
					)
					.setTimestamp(),
			],
		});
	},
});
