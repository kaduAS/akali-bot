import { SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/akali';
import type { Command } from '../../types';

const command: Command = {
	data: new SlashCommandBuilder().setName('help').setDescription('List what Akali can do.'),
	async execute(interaction) {
		await interaction.reply({
			embeds: [
				embed()
					.setTitle('Akali • Rogue Assassin')
					.setDescription('I do what the code tells me. No excuses.')
					.addFields(
						{ name: '🛡️ Moderation', value: '`/ban` `/unban` `/kick` `/timeout` `/warn` `/warnings` `/clearwarns` `/purge` `/slowmode`' },
						{ name: '⚙️ Configuration', value: '`/setup` (logs, welcome, goodbye, autorole, automod, word, levels, disable, view)' },
						{ name: '📈 Levels', value: '`/rank` `/leaderboard`' },
						{ name: '🎧 Radio', value: '`/lofi play` `/lofi stop` `/lofi volume` `/lofi status`' },
						{ name: '🎲 Fun', value: '`/8ball` `/coinflip` `/roll` `/choose` `/poll`' },
						{ name: '💰 Economy', value: '`/daily` `/balance` `/pay`' },
						{ name: '🧰 Utility', value: '`/ping` `/avatar` `/userinfo` `/serverinfo` `/remind` `/help`' },
					),
			],
		});
	},
};

export default command;
