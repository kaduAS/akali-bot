import express from 'express';
import type { Client } from 'discord.js';
import type { Server } from 'node:http';
import { env } from './config';
import { logger } from './lib/logger';

export function startHealthServer(client: Client): Server {
	const app = express();

	app.get('/health', (_req, res) => {
		res.json({
			status: client.isReady() ? 'ok' : 'starting',
			ping: client.ws.ping,
			guilds: client.guilds.cache.size,
			uptime: Math.round(process.uptime()),
		});
	});

	return app.listen(env.PORT, () => logger.info(`Health check at :${env.PORT}/health`));
}
