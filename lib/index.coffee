blessed = require("blessed")

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

createStream = (onWrite) ->
  through (data) ->
    onWrite(data.toString())
    @queue(data)

module.exports = {
  getDirs: (dir) ->
    dir ?= DEFAULT_DIR

    globAsync(dir)

  exec: (cmd) ->
    cmds = cmd.split(",")

    @getDirs()
    .then (dirs) ->
      screen = blessed.screen({
        smartCSR: true
      })

      screen.title = "run:all:#{cmd}";

      screen.key ['escape', 'q', 'C-c'], (ch, key) ->
        process.exit(0)

      packages = dirs.filter (dir) ->
        packageJson = require(path.resolve(dir, "package"))
        return packageJson.scripts[cmd]

      boxWidth = 100 / packages.length

      logs = packages.map (dir, index) ->
        packageName = dir.replace(path.resolve("packages") + "/", "")

        content = ""

        box = blessed.log({
          border: 'line'
          content: content
          label: "#{packageName}:#{cmd}"
          left: "#{index * boxWidth}%"
          height: '100%'
          parent: screen
          top: 0
          width: "#{boxWidth}%"

          scrollable: true
          keys: true
          vi: true
          alwaysScroll: true
          scrollbar: {
            ch: ' '
            inverse: true
          }
        })

        box.key ['escape', 'q', 'C-c'], (ch, key) ->
          process.exit(0)

        return {
          box: box,
          dir: dir,
          stdout: createStream (message) ->
            content += message
            box.setContent(content)
            screen.render()
          stderr: createStream (message) ->
            content += message
            box.setContent(content)
            screen.render()
        }

      screen.render()

      tasks = logs.map (log) ->
        return {
          command: cmd
          options: {
            cwd: log.dir
            stdout: log.stdout
            stderr: log.stderr
          }
        }

      runAll(tasks, {
        continueOnError: true
        parallel: true
        # stdout: process.stdout
        # stderr: process.stderr
      })
      .catch (err) ->
        ## TODO: handle this better
        console.log(err)

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
- stderr
- report proper exit code
- individual control of each pane/task
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
