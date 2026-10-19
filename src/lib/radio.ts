import {
	AudioPlayerStatus,
	NoSubscriberBehavior,
	StreamType,
	VoiceConnectionStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	getVoiceConnection,
	joinVoiceChannel,
	type AudioPlayer,
	type AudioResource,
} from '@discordjs/voice';
import type { Client, VoiceBasedChannel } from 'discord.js';
import prism from 'prism-media';
import type { Readable } from 'node:stream';
import { env } from '../config';
import { logger } from './logger';
import { prisma } from './prisma';

interface RadioSession {
	player: AudioPlayer;
	resource?: AudioResource;
	volume: number;
	channelId: string;
	stopped: boolean;
	retry?: NodeJS.Timeout;
}

const sessions = new Map<string, RadioSession>();

function createResource(volume: number): AudioResource {
	const ffmpeg = new prism.FFmpeg({
		args: [
			'-reconnect', '1',
			'-reconnect_streamed', '1',
			'-reconnect_delay_max', '5',
			'-i', env.LOFI_STREAM_URL,
			'-analyzeduration', '0',
			'-loglevel', '0',
			'-f', 's16le',
			'-ar', '48000',
			'-ac', '2',
		],
	});
	const resource = createAudioResource(ffmpeg as unknown as Readable, {
		inputType: StreamType.Raw,
		inlineVolume: true,
	});
	resource.volume?.setVolume(volume / 100);
	return resource;
}

function play(session: RadioSession): void {
	session.resource = createResource(session.volume);
	session.player.play(session.resource);
}

function scheduleRestart(session: RadioSession): void {
	if (session.stopped) return;
	clearTimeout(session.retry);
	session.retry = setTimeout(() => {
		if (!session.stopped) play(session);
	}, 3_000);
}

export async function startRadio(channel: VoiceBasedChannel, volume = 50): Promise<void> {
	const guildId = channel.guild.id;
	stopRadio(guildId);

	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId,
		adapterCreator: channel.guild.voiceAdapterCreator,
		selfDeaf: true,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
	}
	catch (error) {
		connection.destroy();
		throw error;
	}

	const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
	const session: RadioSession = { player, volume, channelId: channel.id, stopped: false };
	sessions.set(guildId, session);
	connection.subscribe(player);

	player.on(AudioPlayerStatus.Idle, () => scheduleRestart(session));
	player.on('error', (error) => {
		logger.error({ err: error }, `Radio player error (${guildId})`);
		scheduleRestart(session);
	});

	connection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
			]);
		}
		catch {
			if (connection.state.status !== VoiceConnectionStatus.Destroyed) connection.destroy();
		}
	});

	connection.on(VoiceConnectionStatus.Destroyed, () => {
		if (sessions.get(guildId) === session) {
			session.stopped = true;
			clearTimeout(session.retry);
			sessions.delete(guildId);
		}
	});

	play(session);
}

export function stopRadio(guildId: string): void {
	const session = sessions.get(guildId);
	if (session) {
		session.stopped = true;
		clearTimeout(session.retry);
		session.player.stop(true);
		sessions.delete(guildId);
	}
	getVoiceConnection(guildId)?.destroy();
}

export function setRadioVolume(guildId: string, volume: number): boolean {
	const session = sessions.get(guildId);
	if (!session) return false;
	session.volume = volume;
	session.resource?.volume?.setVolume(volume / 100);
	return true;
}

export function getRadioChannelId(guildId: string): string | null {
	return sessions.get(guildId)?.channelId ?? null;
}

export function stopAllRadios(): void {
	for (const guildId of [...sessions.keys()]) stopRadio(guildId);
}

export async function restoreRadios(client: Client): Promise<void> {
	const configs = await prisma.guildConfig.findMany({ where: { radioChannelId: { not: null } } });
	for (const config of configs) {
		try {
			const guild = client.guilds.cache.get(config.guildId);
			const channel = guild?.channels.cache.get(config.radioChannelId ?? '');
			if (!channel || !channel.isVoiceBased()) continue;
			await startRadio(channel, config.radioVolume);
			logger.info(`Lofi radio restored in ${guild?.name}`);
		}
		catch (error) {
			logger.error({ err: error }, `Could not restore the radio in ${config.guildId}`);
		}
	}
}
