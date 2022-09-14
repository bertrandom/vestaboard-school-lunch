#!/bin/bash
rsync --exclude-from=.gitignore -av ./ bertrand@server:/web/vestaboard-school-lunch/
scp config/prod.json5 bertrand@server:/web/vestaboard-school-lunch/config/