import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
	DISCORD_TOKEN: z.string().min(30, 'DISCORD_TOKEN is missing or invalid'),
	DISCORD_CLIENT_ID: z.string().min(5, 'DISCORD_CLIENT_ID is missing'),
	DEV_GUILD_ID: z.string().optional(),
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is missing'),
	LOFI_STREAM_URL: z.string().url().default('https://ice1.somafm.com/groovesalad-128-mp3'),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
	console.error('Invalid environment variables:');
	for (const issue of parsed.error.issues) {
		console.error(`- ${issue.path.join('.')}: ${issue.message}`);
	}
	process.exit(1);
}

export const env = parsed.data;
