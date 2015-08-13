_         = require("lodash")
commander = require("commander")
updater   = require("update-notifier")
human     = require("human-interval")
pkg       = require("../package.json")

## check for updates every hour
updater({pkg: pkg, updateCheckInterval: human("one hour")}).notify()

parseOpts = (opts) ->
  _.pick(opts, "spec", "reporter", "path", "destination")

## instantiate a new program for
## easier testability
program = new commander.Command()

program.version(pkg.version)

program
  .command("install")
  .description("Installs Cypress")
  .option("-d, --destination <path>", "destination path to extract and install Cypress to.")
  .action (opts) ->
    require("./commands/install")(parseOpts(opts))

program
  .command("run [project]")
  .usage("[project] [options]")
  .description("Runs Cypress Tests Headlessly")
  .option("-s, --spec <spec>",         "runs a specific spec file. defaults to 'all'")
  .option("-r, --reporter <reporter>", "runs a specific mocha reporter. pass a path to use a custom reporter. defaults to 'spec'")
  .action (project, opts) ->
    require("./commands/run")(project, parseOpts(opts))

program
  .command("ci [key]")
  .usage("[key] [options]")
  .description("Runs Cypress in CI Mode")
  .option("-r, --reporter <reporter>", "runs a specific mocha reporter. pass a path to use a custom reporter. defaults to 'spec'")
  .action (key, opts) ->
    require("./commands/ci")(key, parseOpts(opts))

program
  .command("get:key [project]")
  .description("Returns your Project's Secret Key for use in CI")
  .action (project) ->
    require("./commands/key")(project)

program
  .command("new:key [project]")
  .description("Generates a new Project Secret Key for use in CI")
  .action (project) ->
    require("./commands/key")(project, {reset: true})

program
  .command("verify")
  .description("Verifies that Cypress is installed correctly and executable")
  .action ->
    require("./commands/verify")()

program.parse(process.argv)

if not program.args.length
  program.help()

module.exports = program