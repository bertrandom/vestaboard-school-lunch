import config from 'pamplemousse';
import { DB } from 'sqlite';
import { DateTime } from 'luxon';

const today = DateTime.local({ zone: 'America/Los_Angeles' }).toISODate();

const db = new DB('data/lunch.db');

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
	menu_date: today,
});

if (rows.length === 0) {
	console.log('No lunch data exists for today, aborting...');
	Deno.exit(0);
}

const choices = [];

for (const row of rows) {
	choices.push(row.menu_item_description);
}

const text = `AURORA'S LUNCH: ${choices.join(' OR ')}`;

console.log(`Sending message to Vestaboard: ${text}`);

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
	console.log(`Message sent: ${body.message.id}`);
} else {
	console.error(
		`${sendMessageResponse.status}: ${sendMessageResponse.statusText}`,
	);
}
