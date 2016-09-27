cp       = require("child_process")
path     = require("path")
glob     = require("glob")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")

globAsync   = Promise.promisify(glob)

DEFAULT_DIR = path.resolve("packages", "@cypress", "*")

module.exports = {
  getDirs: (dir) ->
    dir ?= DEFAULT_DIR

    globAsync(dir)

  exec: (cmd) ->
    cmds = cmd.split(",")

    @getDirs()
    .then (dirs) ->
      exec = (str) =>
        execDir = (dir) ->
          new Promise (resolve, reject) ->
            args = str.split(" ")
            cmd  = args.shift()

            console.log("")
            console.log(chalk.green("Running:"), chalk.magenta(str), chalk.blue(dir))

            sp = cp.spawn(cmd, args, {cwd: dir, stdio: "inherit"})
            sp.on("error", reject)
            sp.on("close", resolve)

        Promise.map(dirs, execDir)

      Promise.each(cmds, exec)

  start: (argv = []) ->
    options = minimist(argv)

    switch
      when e = options.exec
        @exec(e)

      else
        require("@cypress/core-server").start(options)
}