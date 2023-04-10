import config from 'pamplemousse';
import { DB } from 'sqlite';
import { DateTime } from 'luxon';
import * as log from 'https://deno.land/std@0.182.0/log/mod.ts';
import { setupLogging } from './lib/log.ts';
await setupLogging();

const now = DateTime.local({ zone: 'America/Los_Angeles' });
const today = DateTime.local({ zone: 'America/Los_Angeles' }).toISODate();
const tomorrow = DateTime.local({ zone: 'America/Los_Angeles' }).plus({
	days: 1,
}).toISODate();

const db = new DB('data/lunch.db');

let menuDate = null;
// If it's in the morning, show today's lunch menu, but if it's the evening, show tomorrow's lunch menu
if (now.toFormat('a') === 'AM') {
	menuDate = today;
} else {
	menuDate = tomorrow;
}

const query = db.prepareQuery<
	_,
	{
		id: number;
		menu_date: string;
		menu_item_id: number;
		menu_item_description: string;
		created_at: number;
	}
>('SELECT * FROM lunches WHERE menu_date = :menu_date');

const rows = await query.allEntries({
	menu_date: menuDate,
});

if (rows.length === 0) {
	log.info(
		`No lunch data exists for target date ${menuDate}, aborting...`,
	);
	Deno.exit(0);
}

const choices = [];

for (const row of rows) {
	choices.push(row.menu_item_description);
}

const text = `AURORA'S LUNCH: ${choices.join(' OR ')}`;

log.info(`Sending message to Vestaboard: ${text}`);

const sendMessageResponse = await fetch(
	`https://platform.vestaboard.com/subscriptions/${config.vestaboard.subscription_id}/message`,
	{
		'headers': {
			'accept': 'application/json',
			'content-type': 'application/json',
			'X-Vestaboard-Api-Key': config.vestaboard.api_key,
			'X-Vestaboard-Api-Secret': config.vestaboard.api_secret,
		},
		'body': JSON.stringify({
			text: text,
		}),
		'method': 'POST',
	},
);

if (sendMessageResponse.status === 200) {
	const body = await sendMessageResponse.json();
	log.info(`Message sent: ${body.message?.id}`);
} else {
	console.error(
		`${sendMessageResponse.status}: ${sendMessageResponse.statusText}`,
	);
}
