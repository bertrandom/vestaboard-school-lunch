import * as log from 'https://deno.land/std@0.182.0/log/mod.ts';
import { DateTime } from 'luxon';

export async function setupLogging() {
	await log.setup({
		handlers: {
			console: new log.handlers.ConsoleHandler('DEBUG', {
				formatter: (rec) => {
					const ts = DateTime.now().toFormat(
						'yyyy-LL-dd HH:mm:ss.SSS',
					);
					return `${ts} [${rec.levelName}] ${rec.msg}`;
				},
			}),
		},

		loggers: {
			default: {
				level: 'DEBUG',
				handlers: ['console'],
			},
		},
	});
}
