import type {
	ChatInputCommandInteraction,
	ClientEvents,
	Collection,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

export interface Command {
	data: {
		name: string;
		toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
	};
	cooldown?: number;
	execute(interaction: ChatInputCommandInteraction<'cached'>): Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
	name: K;
	once?: boolean;
	execute(...args: ClientEvents[K]): Promise<void> | void;
}

export function defineEvent<K extends keyof ClientEvents>(event: BotEvent<K>): BotEvent<K> {
	return event;
}

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>;
		cooldowns: Collection<string, Collection<string, number>>;
	}
}
