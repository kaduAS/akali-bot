import { ChannelType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embed, errorEmbed, successEmbed } from '../../lib/akali';
import { getConfig, updateConfig } from '../../lib/guildConfig';
import type { Command } from '../../types';

const textChannels = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;
const onOff = (value: boolean): string => (value ? 'on' : 'off');
const mention = (id: string | null, prefix = '<#'): string => (id ? `${prefix}${id}>` : 'not set');

const command: Command = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Configure Akali in this server.')
		.addSubcommand((s) =>
			s.setName('logs').setDescription('Moderation log channel')
				.addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(...textChannels).setRequired(true)),
		)
		.addSubcommand((s) =>
			s.setName('welcome').setDescription('Welcome channel and message')
				.addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(...textChannels).setRequired(true))
				.addStringOption((o) => o.setName('message').setDescription('Use {user}, {server} and {count}').setMaxLength(500)),
		)
		.addSubcommand((s) =>
			s.setName('goodbye').setDescription('Goodbye channel')
				.addChannelOption((o) => o.setName('channel').setDescription('Channel').addChannelTypes(...textChannels).setRequired(true)),
		)
		.addSubcommand((s) =>
			s.setName('autorole').setDescription('Role given automatically to new members')
				.addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)),
		)
		.addSubcommand((s) =>
			s.setName('automod').setDescription('Turn automod and its rules on/off')
				.addBooleanOption((o) => o.setName('enabled').setDescription('Automod enabled?'))
				.addBooleanOption((o) => o.setName('invites').setDescription('Block invites to other servers'))
				.addBooleanOption((o) => o.setName('links').setDescription('Block any link'))
				.addBooleanOption((o) => o.setName('caps').setDescription('Block excessive CAPS'))
				.addBooleanOption((o) => o.setName('spam').setDescription('Block spam (5 messages in 5s)'))
				.addIntegerOption((o) => o.setName('warn_limit').setDescription('Warnings until automatic timeout').setMinValue(1).setMaxValue(20))
				.addIntegerOption((o) => o.setName('mute_minutes').setDescription('Automatic timeout duration (minutes)').setMinValue(1).setMaxValue(40_320)),
		)
		.addSubcommand((s) =>
			s.setName('word').setDescription('Manage banned words')
				.addStringOption((o) =>
					o.setName('action').setDescription('Add or remove').setRequired(true)
						.addChoices({ name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }),
				)
				.addStringOption((o) => o.setName('word').setDescription('The word').setRequired(true).setMaxLength(40)),
		)
		.addSubcommand((s) =>
			s.setName('levels').setDescription('Level system')
				.addBooleanOption((o) => o.setName('enabled').setDescription('Levels enabled?').setRequired(true))
				.addChannelOption((o) => o.setName('channel').setDescription('Channel for level-up announcements').addChannelTypes(...textChannels)),
		)
		.addSubcommand((s) =>
			s.setName('disable').setDescription('Disable a feature')
				.addStringOption((o) =>
					o.setName('feature').setDescription('What to turn off').setRequired(true)
						.addChoices(
							{ name: 'logs', value: 'logChannelId' },
							{ name: 'welcome', value: 'welcomeChannelId' },
							{ name: 'goodbye', value: 'goodbyeChannelId' },
							{ name: 'autorole', value: 'autoRoleId' },
							{ name: 'level-up channel', value: 'levelUpChannelId' },
						),
				),
		)
		.addSubcommand((s) => s.setName('view').setDescription('Show the current configuration'))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const guildId = interaction.guildId;
		const sub = interaction.options.getSubcommand();

		switch (sub) {
			case 'logs': {
				const channel = interaction.options.getChannel('channel', true);
				await updateConfig(guildId, { logChannelId: channel.id });
				await interaction.reply({ embeds: [successEmbed(`Logs will be sent to <#${channel.id}>.`)] });
				return;
			}
			case 'welcome': {
				const channel = interaction.options.getChannel('channel', true);
				const message = interaction.options.getString('message');
				await updateConfig(guildId, { welcomeChannelId: channel.id, ...(message ? { welcomeMessage: message } : {}) });
				await interaction.reply({ embeds: [successEmbed(`Welcome messages in <#${channel.id}>.`)] });
				return;
			}
			case 'goodbye': {
				const channel = interaction.options.getChannel('channel', true);
				await updateConfig(guildId, { goodbyeChannelId: channel.id });
				await interaction.reply({ embeds: [successEmbed(`Goodbye messages in <#${channel.id}>.`)] });
				return;
			}
			case 'autorole': {
				const role = interaction.options.getRole('role', true);
				const me = interaction.guild.members.me;
				if (!me || role.position >= me.roles.highest.position) {
					await interaction.reply({
						embeds: [errorEmbed("That role is above mine. Move Akali's role above it.")],
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				await updateConfig(guildId, { autoRoleId: role.id });
				await interaction.reply({ embeds: [successEmbed(`New members will receive <@&${role.id}>.`)] });
				return;
			}
			case 'automod': {
				const data = {
					automodEnabled: interaction.options.getBoolean('enabled') ?? undefined,
					blockInvites: interaction.options.getBoolean('invites') ?? undefined,
					blockLinks: interaction.options.getBoolean('links') ?? undefined,
					blockCaps: interaction.options.getBoolean('caps') ?? undefined,
					blockSpam: interaction.options.getBoolean('spam') ?? undefined,
					maxWarnsBeforeMute: interaction.options.getInteger('warn_limit') ?? undefined,
					muteMinutes: interaction.options.getInteger('mute_minutes') ?? undefined,
				};
				const config = await updateConfig(guildId, data);
				await interaction.reply({
					embeds: [
						successEmbed(
							[
								`Automod: **${onOff(config.automodEnabled)}**`,
								`Invites: ${onOff(config.blockInvites)} • Links: ${onOff(config.blockLinks)}`,
								`Caps: ${onOff(config.blockCaps)} • Spam: ${onOff(config.blockSpam)}`,
								`${config.maxWarnsBeforeMute} warning(s) → timeout of ${config.muteMinutes} min`,
							].join('\n'),
						),
					],
				});
				return;
			}
			case 'word': {
				const action = interaction.options.getString('action', true);
				const word = interaction.options.getString('word', true).toLowerCase().trim();
				const config = await getConfig(guildId);
				const words = new Set(config.badWords);
				if (action === 'add') words.add(word);
				else words.delete(word);
				await updateConfig(guildId, { badWords: [...words] });
				await interaction.reply({
					embeds: [successEmbed(`Banned words: ${words.size}.`)],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			case 'levels': {
				const channel = interaction.options.getChannel('channel');
				await updateConfig(guildId, {
					levelsEnabled: interaction.options.getBoolean('enabled', true),
					...(channel ? { levelUpChannelId: channel.id } : {}),
				});
				await interaction.reply({ embeds: [successEmbed('Level system updated.')] });
				return;
			}
			case 'disable': {
				const field = interaction.options.getString('feature', true);
				await updateConfig(guildId, { [field]: null });
				await interaction.reply({ embeds: [successEmbed('Feature disabled.')] });
				return;
			}
			default: {
				const config = await getConfig(guildId);
				await interaction.reply({
					embeds: [
						embed()
							.setTitle('Akali configuration')
							.addFields(
								{ name: 'Logs', value: mention(config.logChannelId), inline: true },
								{ name: 'Welcome', value: mention(config.welcomeChannelId), inline: true },
								{ name: 'Goodbye', value: mention(config.goodbyeChannelId), inline: true },
								{ name: 'Authorole', value: mention(config.autoRoleId, '<@&'), inline: true },
								{ name: 'Levels', value: onOff(config.levelsEnabled), inline: true },
								{ name: 'Lofi radio', value: mention(config.radioChannelId), inline: true },
								{
									name: 'Automod',
									value: `${onOff(config.automodEnabled)} • ${config.badWords.length} banned word(s)`,
								},
								{ name: 'Welcome message', value: config.welcomeMessage },
							),
					],
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	},
};

export default command;
