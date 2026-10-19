import { EmbedBuilder } from 'discord.js';

export const COLOR = 0x7c3aed;

const lines = {
	success: [
		'Done. No noise, no witnesses.',
		'Target handled. Next.',
		"Mission complete. Didn't even need the smoke.",
		'Done. Quick and clean, my way.',
	],
	fail: [
		"Something went wrong. I'll rethink the plan.",
		"That mission didn't go as planned.",
		'I failed this time. Try again.',
	],
	noPermission: [
		"You don't have the authority for that. Even I don't take orders from just anyone.",
		'No permission, no action. Simple as that.',
	],
	cooldown: [
		'Easy. Even an assassin needs to catch her breath.',
		"Slow down. I'm not that fast... okay, I am, but respect the cooldown.",
	],
	welcome: [
		'Someone else stepped into the shadows.',
		'New face in the server. Behave.',
	],
	eightBall: [
		'Yes. The shadows confirm.',
		'Without a doubt.',
		'All signs point to yes.',
		'Likely. But stay alert.',
		"Ask again when I'm in a better mood.",
		"I can't see anything through all this smoke.",
		"I wouldn't bet on it.",
		'My answer is no.',
		'Very unlikely.',
		'Not a chance.',
	],
	daily: [
		"Today's loot collected.",
		'A small daily heist, all within the law... more or less.',
	],
} as const;

export type LineKind = keyof typeof lines;

export function say(kind: LineKind): string {
	const options = lines[kind];
	return options[Math.floor(Math.random() * options.length)];
}

export function embed(): EmbedBuilder {
	return new EmbedBuilder().setColor(COLOR).setFooter({ text: 'Akali • Rogue Assassin' });
}

export function errorEmbed(text: string): EmbedBuilder {
	return embed().setColor(0xe11d48).setDescription(text);
}

export function successEmbed(text: string): EmbedBuilder {
	return embed().setColor(0x22c55e).setDescription(text);
}
