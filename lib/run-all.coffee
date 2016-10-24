_ = require("lodash")
path = require("path")
AsciiTable = require("ascii-table")
glob = require("glob")
chalk = require("chalk")
Promise = require("bluebird")
runAll = require("@cypress/npm-run-all")
through = require("through")

globAsync = Promise.promisify(glob)

setTerminalTitle = (title) ->
  process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  )

packageNameFromPath = (fullPath) ->
  fullPath.replace(path.resolve("packages") + "/", "")

getDirs = () ->
  packagesDir = path.resolve("packages", "*")
  globAsync(packagesDir)

filterDirsByPackage = (dirs, packages) ->
  return dirs unless packages

  return dirs.filter (dir) ->
    packageName = packageNameFromPath(dir)
    return _.includes(packages, packageName)

filterDirsByCmd = (dirs, cmd) ->
  return dirs if cmd is "install"

  dirs.filter (dir) ->
    packageJson = require(path.resolve(dir, "package"))
    return !!packageJson.scripts[cmd]

checkDirsLength = (dirs, errMessage) ->
  return dirs if dirs.length

  err = new Error(errMessage)
  err.noPackages = true
  throw err

mapTasks = (cmd, packages) ->
  colors = "green yellow blue magenta cyan white gray bgGreen bgYellow bgBlue bgMagenta bgCyan bgWhite".split(" ")

  runCommand = switch cmd
    when "install", "test" then cmd
    else "run #{cmd}"

  packages.map (dir, index) ->
    packageName = packageNameFromPath(dir)
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

noPackagesError = (err) -> err.noPackages
resultsError = (err) -> !!err.results

module.exports = (cmd, options) ->
  setTerminalTitle("run:all:#{cmd}")

  packagesFilter = options.package or options.packages

  getDirs()
  .then (dirs) ->
    filterDirsByPackage(dirs, packagesFilter)
  .then (dirs) ->
    checkDirsLength(dirs, "No packages were found with the filter '#{packagesFilter}'")
  .then (dirs) ->
    filterDirsByCmd(dirs, cmd)
  .then (dirs) ->
    errMessage = "No packages were found with the task '#{cmd}'"
    if packagesFilter
      errMessage += " and the filter '#{packagesFilter}'"
    checkDirsLength(dirs, errMessage)
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

  .catch noPackagesError, (err) ->
    console.error(chalk.red("\n#{err.message}"))
    process.exit(1)

  .catch resultsError, (err) ->
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
