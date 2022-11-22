import config from 'pamplemousse';
import { DB } from 'sqlite';
import { DateTime } from 'luxon';

async function getCachedToken(db: DB) {
	const query = db.prepareQuery<[string]>(
		'SELECT token FROM tokens WHERE expires > :now ORDER BY created_at DESC LIMIT 1',
	);

	const row = await query.first({
		now: DateTime.now().toUnixInteger(),
	});

	if (row === undefined) {
		return null;
	}

	return row[0];
}

async function getSchoolCafeTokenInfo() {
	const now = DateTime.now().toUnixInteger();

	const tokenResponse = await fetch('https://webapis.schoolcafe.com/token', {
		'headers': {
			'accept': 'application/json, text/plain, */*',
			'accept-language': 'en-US,en;q=0.9',
			'content-type': 'application/x-www-form-urlencoded',
			'sec-ch-ua':
				'"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"macOS"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-site',
		},
		'referrer': 'https://www.schoolcafe.com/',
		'referrerPolicy': 'strict-origin-when-cross-origin',
		'body': `username=${
			encodeURIComponent(config.schoolcafe.username)
		}&password=${
			encodeURIComponent(config.schoolcafe.password)
		}&grant_type=password&scope=undefined`,
		'method': 'POST',
		'mode': 'cors',
		'credentials': 'omit',
	});

	const body = await tokenResponse.json();

	return {
		access_token: body.access_token,
		expires: now + parseInt(body.expires_in, 10),
		online_apps_token: body.OnlineAppsToken,
		user_id: body.UserId,
		email: body.Email,
	};
}

async function getRawWeeklyLunchMenu(token: string, startOfWeek: DateTime) {
	const startOfWeekFormatted = encodeURIComponent(
		startOfWeek.toFormat('MM/dd/yyyy'),
	);

	const response = await fetch(
		`https://webapis.schoolcafe.com/api/CalendarView/GetWeeklyMenuitems?SchoolId=${config.schoolcafe.school_id}&ServingDate=${startOfWeekFormatted}&ServingLine=SFUSD&MealType=Lunch&enabledWeekendMenus=true`,
		{
			'headers': {
				'accept': 'application/json',
				'accept-language': 'en-US,en;q=0.9',
				'authorization': `Bearer ${token}`,
				'sec-ch-ua':
					'"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"macOS"',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-site',
			},
			'referrer': 'https://www.schoolcafe.com/',
			'referrerPolicy': 'strict-origin-when-cross-origin',
			'body': null,
			'method': 'GET',
			'mode': 'cors',
			'credentials': 'include',
		},
	);

	return await response.json();
}

function parseRawWeeklyLunchMenu(rawMenu: any) {
	const menu = [];

	for (const day in rawMenu) {
		const menuDate = DateTime.fromFormat(day, 'M/d/yyyy').toISODate();

		const hotLunches = rawMenu[day]['LUNCH- HOT'];
		for (const hotLunch of hotLunches) {
			if (hotLunch.MenuItemId > 0) {
				menu.push({
					menu_date: menuDate,
					menu_item_id: hotLunch.MenuItemId,
					menu_item_description: hotLunch.MenuItemDescription.replace(
						/\([0-9A-Z- ]+\)/, // Remove the appended (K-5) or (K-12)
						'',
					).trim(),
				});
			}
		}
	}

	return menu;
}

async function addLunchesToDb(db: DB, menu) {
	let addedRowCount = 0;

	for (const lunch of menu) {
		const query = db.prepareQuery<[string, number]>(
			'SELECT * FROM lunches WHERE menu_date = :menu_date AND menu_item_id = :menu_item_id LIMIT 1',
		);

		const row = await query.first({
			menu_date: lunch.menu_date,
			menu_item_id: lunch.menu_item_id,
		});

		if (row === undefined) {
			db.query(
				'INSERT INTO lunches (menu_date, menu_item_id, menu_item_description, created_at) VALUES (?, ?, ?, ?)',
				[
					lunch.menu_date,
					lunch.menu_item_id,
					lunch.menu_item_description,
					DateTime.now().toUnixInteger(),
				],
			);
			addedRowCount++;
		}
	}

	if (addedRowCount > 0) {
		console.log(`Added ${addedRowCount} new lunches to DB.`);
	} else {
		console.log(`No new lunches added to DB.`);
	}
}

const db = new DB('data/lunch.db');
db.execute(`
	CREATE TABLE IF NOT EXISTS tokens (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		token TEXT,
		expires INTEGER,
		created_at INTEGER
	);
	CREATE TABLE IF NOT EXISTS lunches (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		menu_date TEXT,
		menu_item_id INTEGER,
		menu_item_description TEXT,
		created_at INTEGER
	);
`);

const now = DateTime.now().toUnixInteger();

db.execute(
	`DELETE from tokens WHERE expires < ${now}`,
);
let token = null;

const cachedToken = await getCachedToken(db);
if (!cachedToken) {
	console.log(`Retrieving access token for ${config.schoolcafe.username}...`);

	const tokenInfo = await getSchoolCafeTokenInfo();
	console.log(`Access token for ${tokenInfo.email} retrieved.`);

	console.log(`Storing access token in cache.`);
	db.query(
		'INSERT INTO tokens (token, expires, created_at) VALUES (?, ?, ?)',
		[
			tokenInfo.access_token,
			tokenInfo.expires,
			now,
		],
	);

	token = tokenInfo.access_token;
} else {
	console.log(`Found token in cache.`);
	token = cachedToken;
}

const rawMenu = await getRawWeeklyLunchMenu(
	token,
	DateTime.now().setZone('America/Los_Angeles').startOf('week'),
);
const menu = parseRawWeeklyLunchMenu(rawMenu);
addLunchesToDb(db, menu);
