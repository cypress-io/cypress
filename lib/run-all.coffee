path = require("path")
AsciiTable = require("ascii-table")
glob = require("glob")
chalk = require("chalk")
Promise = require("bluebird")
runAll = require("@cypress/npm-run-all")
through = require("through")

globAsync = Promise.promisify(glob)

DEFAULT_DIR = path.resolve("packages", "*")

setTerminalTitle = (title) ->
  process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  )

getDirs = (dir) ->
  dir ?= DEFAULT_DIR
  globAsync(dir)

getPackages = (cmd, dirs) ->
  return dirs if cmd is "install"

  dirs.filter (dir) ->
    packageJson = require(path.resolve(dir, "package"))
    return !!packageJson.scripts[cmd]

mapTasks = (cmd, dirs) ->
  colors = "green yellow blue magenta cyan white gray bgGreen bgYellow bgBlue bgMagenta bgCyan bgWhite".split(" ")

  runCommand = switch cmd
    when "install", "test" then cmd
    else "run #{cmd}"

  getPackages(cmd, dirs).map (dir, index) ->
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

stderrOutput = ""
collectStderr = through (data) ->
  stderrOutput += data.toString()
  @queue(data)

collectStderr.pipe(process.stderr)

module.exports = (cmd, options) ->
  setTerminalTitle("run:all:#{cmd}")

  getDirs()
  .then (dirs) ->
    mapTasks(cmd, dirs)
  .then (tasks) ->
    runAll(tasks, {
      parallel: if options.serial then false else true
      stdout: process.stdout
      stderr: collectStderr
    })
  .then ->
    console.log(chalk.green("\nAll tasks completed successfully"))
  .catch (err) ->
    throw err unless err.results

    results = AsciiTable.factory({
      heading: ["package", "exit code"]
      rows: err.results.map (result) ->
        [result.name.replace(":#{cmd}", ""), result.code]
    }).toString()

    console.error(chalk.red("\nOne or more tasks failed running 'npm run all #{cmd}'."))
    console.error("\nResults:\n")
    console.error(results)

    console.error("\nstderr:\n")
    console.error(stderrOutput)

    process.exit(1)
