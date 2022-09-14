# vestaboard-school-lunch

Every day, my daugher is presented with two terrible options for lunch at school. This displays those options on my split-flap display in the morning, to get her excited about them and give her the illusion of choice.

Retrieves the school lunch option choices from [SchoolCafé](https://www.schoolcafe.com/) and pushes today's choice to my split-flap display. Lunch choices are stored in an sqlite DB.

![web vestaboard com_simulator_ddec790d-031b-4226-abfa-1fdedb5902e6](https://user-images.githubusercontent.com/57770/190040398-2ea78476-001a-4173-bc71-9763c7fc3886.png)

# setup

Copy `default.json5` to `local.json5` and fill in your School Cafe login and Vestaboard API keys.

If you want to use different environments, you can copy it to `dev.json5` or `prod.json5` and preface any commands with `NODE_ENV=dev ` or `NODE_ENV=prod `.

# usage

Retrieve the weekly lunch menu
```
deno run --allow-env --allow-read=./,.env,config,data --allow-write=data --allow-net=webapis.schoolcafe.com retrieve_lunch_menu.ts
```

Push it to the Vestaboard
```
deno run --allow-env --allow-read=./,.env,config,data --allow-write=data --allow-net=platform.vestaboard.com push_to_vestaboard.ts
```

While these commands can be run manually, it's expected that they are to be run via a cronjob. `crontab` contains an example.

# debugging

You can open the sqlite DB by doing this:

```
> sqlite3 -box data/lunch.db
sqlite> SELECT * from lunches;
┌────┬────────────┬──────────────┬────────────────────────────────────────────┬────────────┐
│ id │ menu_date  │ menu_item_id │           menu_item_description            │ created_at │
├────┼────────────┼──────────────┼────────────────────────────────────────────┼────────────┤
│ 1  │ 2022-09-12 │ 124086       │ Mozzarella Breadsticks w/ Marinara Cup     │ 1663113136 │
│ 2  │ 2022-09-12 │ 124897       │ Chicken Tamale w/ Rice & Black Beans       │ 1663113136 │
│ 3  │ 2022-09-13 │ 108237       │ Pasta Spaghetti w/ Meatballs               │ 1663113136 │
│ 4  │ 2022-09-13 │ 109560       │ Pasta Alfredo                              │ 1663113136 │
│ 5  │ 2022-09-14 │ 53261        │ Cheeseburger Flame-Broiled Beef            │ 1663113136 │
│ 6  │ 2022-09-14 │ 53527        │ Breakfast for Lunch: Pancakes with Omelet  │ 1663113136 │
│ 7  │ 2022-09-15 │ 54463        │ Turkey Pepperoni Pizza                     │ 1663113136 │
│ 8  │ 2022-09-15 │ 75529        │ Bean & Cheese Burrito                      │ 1663113136 │
│ 9  │ 2022-09-16 │ 109662       │ Enchilada Cheese w/ Rice & Beans           │ 1663113137 │
│ 10 │ 2022-09-16 │ 102791       │ Orange Chicken Bites w/ Not- So-Fried Rice │ 1663113137 │
└────┴────────────┴──────────────┴────────────────────────────────────────────┴────────────┘
```

Timestamps are stored as unix timestamps.