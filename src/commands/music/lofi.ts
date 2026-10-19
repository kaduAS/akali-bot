import { ChannelType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embed, errorEmbed, say, successEmbed } from '../../lib/akali';
import { getConfig, updateConfig } from '../../lib/guildConfig';
import { getRadioChannelId, setRadioVolume, startRadio, stopRadio } from '../../lib/radio';
import type { Command } from '../../types';

const voiceTypes = [ChannelType.GuildVoice, ChannelType.GuildStageVoice] as const;

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('lofi')
		.setDescription('Lofi radio 24/7 in a voice channel.')
		.addSubcommand((s) =>
			s.setName('play').setDescription('Start the lofi radio (stays on 24/7)')
				.addChannelOption((o) => o.setName('channel').setDescription('Voice channel (default: yours)').addChannelTypes(...voiceTypes)),
		)
		.addSubcommand((s) => s.setName('stop').setDescription('Stop the radio and leave the channel'))
		.addSubcommand((s) =>
			s.setName('volume').setDescription('Adjust the volume')
				.addIntegerOption((o) => o.setName('level').setDescription('0 to 100').setRequired(true).setMinValue(0).setMaxValue(100)),
		)
		.addSubcommand((s) => s.setName('status').setDescription('Show the radio status'))
		.setContexts(InteractionContextType.Guild),
	cooldown: 5,
	async execute(interaction) {
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guildId;
		const isManager = interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);

		if (sub === 'status') {
			const channelId = getRadioChannelId(guildId);
			const config = await getConfig(guildId);
			await interaction.reply({
				embeds: [
					embed()
						.setTitle('Lofi radio')
						.setDescription(channelId ? `Playing in <#${channelId}> (volume ${config.radioVolume}%).` : 'Off.'),
				],
			});
			return;
		}

		if (!isManager) {
			await interaction.reply({ embeds: [errorEmbed(say('noPermission'))], flags: MessageFlags.Ephemeral });
			return;
		}

		if (sub === 'stop') {
			stopRadio(guildId);
			await updateConfig(guildId, { radioChannelId: null });
			await interaction.reply({ embeds: [successEmbed('Radio stopped. I left the channel.')] });
			return;
		}

		if (sub === 'volume') {
			const volume = interaction.options.getInteger('level', true);
			await updateConfig(guildId, { radioVolume: volume });
			setRadioVolume(guildId, volume);
			await interaction.reply({ embeds: [successEmbed(`Volume set to ${volume}%.`)] });
			return;
		}

		const requested = interaction.options.getChannel('channel');
		const channel = requested
			? interaction.guild.channels.cache.get(requested.id)
			: interaction.member.voice.channel;

		if (!channel || !channel.isVoiceBased()) {
			await interaction.reply({
				embeds: [errorEmbed('Join a voice channel or pick one in the command.')],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const me = interaction.guild.members.me;
		const permissions = me ? channel.permissionsFor(me) : null;
		if (!permissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
			await interaction.reply({
				embeds: [errorEmbed("I don't have permission to join or speak in that channel.")],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.deferReply();
		const config = await getConfig(guildId);

		try {
			await startRadio(channel, config.radioVolume);
		}
		catch {
			await interaction.editReply({ embeds: [errorEmbed("I couldn't connect to the voice channel.")] });
			return;
		}

		await updateConfig(guildId, { radioChannelId: channel.id });
		await interaction.editReply({
			embeds: [successEmbed(`Lofi radio started in <#${channel.id}>. It comes back on its own if I restart.`)],
		});
	},
};

export default command;
