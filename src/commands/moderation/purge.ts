import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { errorEmbed, say, successEmbed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Delete recent messages in the channel (up to 14 days old).')
		.addIntegerOption((o) =>
			o.setName('amount').setDescription('Amount (1-100)').setRequired(true).setMinValue(1).setMaxValue(100),
		)
		.addUserOption((o) => o.setName('member').setDescription("Only delete this member's messages"))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setContexts(InteractionContextType.Guild),
	cooldown: 5,
	async execute(interaction) {
		const channel = interaction.channel;
		if (!channel || !('bulkDelete' in channel)) {
			await interaction.reply({ embeds: [errorEmbed("I can't purge this type of channel.")], flags: MessageFlags.Ephemeral });
			return;
		}

		const amount = interaction.options.getInteger('amount', true);
		const target = interaction.options.getUser('member');

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		let deleted: number;
		if (target) {
			const fetched = await channel.messages.fetch({ limit: 100 });
			const filtered = [...fetched.filter((m) => m.author.id === target.id).values()].slice(0, amount);
			deleted = (await channel.bulkDelete(filtered, true)).size;
		}
		else {
			deleted = (await channel.bulkDelete(amount, true)).size;
		}

		await interaction.editReply({ embeds: [successEmbed(`${say('success')}\n${deleted} message(s) deleted.`)] });
	},
};

export default command;
