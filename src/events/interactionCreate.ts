import { Collection, Events, MessageFlags } from 'discord.js';
import { errorEmbed, say } from '../lib/akali';
import { logger } from '../lib/logger';
import { defineEvent } from '../types';

export default defineEvent({
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			logger.error(`No command found for ${interaction.commandName}.`);
			return;
		}

		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				embeds: [errorEmbed('I only work inside servers.')],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const { cooldowns } = interaction.client;
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const timestamps = cooldowns.get(command.data.name) as Collection<string, number>;
		const cooldownAmount = (command.cooldown ?? 3) * 1_000;
		const now = Date.now();
		const previous = timestamps.get(interaction.user.id);

		if (previous && now < previous + cooldownAmount) {
			const expires = Math.round((previous + cooldownAmount) / 1_000);
			await interaction.reply({
				embeds: [errorEmbed(`${say('cooldown')} Try again <t:${expires}:R>.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		try {
			await command.execute(interaction);
		}
		catch (error) {
			logger.error({ err: error }, `Error running /${interaction.commandName}`);
			const payload = { embeds: [errorEmbed(say('fail'))], flags: MessageFlags.Ephemeral } as const;
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(payload).catch(() => null);
			}
			else {
				await interaction.reply(payload).catch(() => null);
			}
		}
	},
});
