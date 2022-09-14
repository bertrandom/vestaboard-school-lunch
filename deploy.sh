#!/bin/bash
rsync --exclude=.git --exclude-from=.gitignore -av ./ bertrand@server:/web/vestaboard-school-lunch/
scp config/prod.json5 bertrand@server:/web/vestaboard-school-lunch/config/