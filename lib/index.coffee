cp       = require("child_process")
path     = require("path")
glob     = require("glob")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")
runAll   = require("@cypress/npm-run-all")
through = require("through")

globAsync   = Promise.promisify(glob)

DEFAULT_DIR = path.resolve("packages", "*")

getPackages = (cmd, dirs) ->
  return dirs if cmd is "install"

  dirs.filter (dir) ->
    packageJson = require(path.resolve(dir, "package"))
    return !!packageJson.scripts[cmd]

setTerminalTitle = (title) ->
  process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  )

colors = "black red green yellow blue magenta cyan white gray".split(" ")

module.exports = {
  getDirs: (dir) ->
    dir ?= DEFAULT_DIR

    globAsync(dir)

  exec: (cmd) ->
    setTerminalTitle("run:all:#{cmd}")

    @getDirs()
    .then (dirs) ->
      tasks = getPackages(cmd, dirs).map (dir, index) ->
        packageName = dir.replace(path.resolve("packages") + "/", "")
        return {
          command: cmd
          options: {
            cwd: dir
            label: {
              name: "#{packageName}:#{cmd}"
              color: colors[index]
            }
          }
        }

      runAll(tasks, {
        continueOnError: true
        parallel: true
        stdout: process.stdout
        stderr: process.stderr
      })
      .catch (err) ->
        console.error(err)

  start: (argv = []) ->
    options = minimist(argv)

    switch
      when e = options.exec or options._[0]
        @exec(e)

      else
        require("core-app").start(options)
}


###

work out script running UX
- report proper exit code
- preserve coloring of individual output
  * nodemon's colors are coming through, so see what it does
- bring back panes
  * need to be able to scroll
work out build dependencies
- e.g. runner waits on reporter
- any other examples? if not, just deal with runner/reporter
wire up interdependencies correctly
- @cypress/core-runner -> core-runner
handle deployment
core-app -> core-server
more some core-app stuff into root
tests?
- unit/integration in each package
- e2e should be in root
running all tests
- needs to be sequential?
- unit tests in parallel?
- how are errors reporter?

###
