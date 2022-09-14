![web vestaboard com_simulator_ddec790d-031b-4226-abfa-1fdedb5902e6](https://user-images.githubusercontent.com/57770/190040398-2ea78476-001a-4173-bc71-9763c7fc3886.png)


```
NODE_ENV=dev deno run --allow-env --allow-read=./,.env,config,data --allow-write=data --allow-net=webapis.schoolcafe.com retrieve_lunch_menu.ts
```

```
NODE_ENV=dev deno run --allow-env --allow-read=./,.env,config,data --allow-write=data --allow-net=platform.vestaboard.com push_to_vestaboard.ts
```
