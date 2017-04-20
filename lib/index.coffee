minimist = require("minimist")
runAll = require("./run-all")

module.exports = {
  start: (argv = []) ->
    options = minimist(argv)

    switch
      when cmd = options._[0]
        runAll(cmd, options)

      else
        require("packages/core-app").start()
}


###

starting app
deployment
break up core-app
- root of monorepo
- core-server
- core-driver
tests
- unit/integration in each package
- e2e should be in root
work out script running UX
- preserve coloring of individual output
  * nodemon's colors are coming through, so see what it does
- bring back panes
  * need to be able to scroll

requirements
---
developers will generally work in one repo at a time
- in terminal, pwd is that repo (packages/core-app)
- run tests individually per package
from root:
- npm install (or run one command to npm install) for all packages
- start app and run it
- run watch-dev for all packages
- run e2e tests

###
