minimist = require("minimist")
runAll = require("./run-all")

module.exports = {
  start: (argv = []) ->
    options = minimist(argv)

    switch
      when cmd = options._[0]
        runAll(cmd)

      else
        require("packages/core-app").start()
}


###

run a task for an individual repo
clean task (probably per repo the 'npm run all clean')
remove node_modules task (clean install)
starting app
deployment
break up core-app
- root of monorepo
- core-server
- core-driver
tests
- unit/integration in each package
- e2e should be in root
running all tests
- needs to be sequential?
- unit tests in parallel?
- how are errors reporter?
work out script running UX
- preserve coloring of individual output
  * nodemon's colors are coming through, so see what it does
- bring back panes
  * need to be able to scroll

###
