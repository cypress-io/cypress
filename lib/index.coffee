cp       = require("child_process")
path     = require("path")

AsciiTable = require("ascii-table")
glob     = require("glob")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")
runAll   = require("@cypress/npm-run-all")
through  = require("through")

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

colors = "green yellow blue magenta cyan white gray bgGreen bgYellow bgBlue bgMagenta bgCyan bgWhite".split(" ")

module.exports = {
  getDirs: (dir) ->
    dir ?= DEFAULT_DIR

    globAsync(dir)

  exec: (cmd) ->
    setTerminalTitle("run:all:#{cmd}")

    runCommand = if cmd is "install" or cmd is "test"
      cmd
    else
      "run #{cmd}"

    @getDirs()
    .then (dirs) ->
      tasks = getPackages(cmd, dirs).map (dir, index) ->
        packageName = dir.replace(path.resolve("packages") + "/", "")
        return {
          command: runCommand
          options: {
            cwd: dir
            label: {
              name: "#{packageName}:#{cmd}"
              color: colors[index]
            }
          }
        }

      runAll(tasks, {
        parallel: true
        stdout: process.stdout
        stderr: process.stderr
      })
      .catch (err) ->
        results = AsciiTable.factory({
          heading: ["package", "exit code"]
          rows: err.results.map (result) ->
            [result.name.replace(":#{cmd}", ""), result.code]
        }).toString()

        console.error(chalk.red("\nOne or more tasks failed running 'npm run all #{cmd}'. Results:\n"))
        console.error(results)

        process.exit(1)

  start: (argv = []) ->
    options = minimist(argv)

    switch
      when e = options.exec or options._[0]
        @exec(e)

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
