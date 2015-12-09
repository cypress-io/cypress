_         = require("lodash")
commander = require("commander")
updater   = require("update-notifier")
human     = require("human-interval")
pkg       = require("../package.json")

## check for updates every hour
updater({pkg: pkg, updateCheckInterval: human("one hour")}).notify()

parseOpts = (opts) ->
  _.pick(opts, "spec", "reporter", "path", "destination", "port", "env", "cypressVersion")

descriptions = {
  destination: "destination path to extract and install Cypress to"
  spec:        "runs a specific spec file. defaults to 'all'"
  reporter:    "runs a specific mocha reporter. pass a path to use a custom reporter. defaults to 'spec'"
  port:        "runs Cypress on a specific port. overrides any value in cypress.json. defaults to '2020'"
  env:         "sets environment variables. separate multiple values with a comma. overrides any value in cypress.json or cypress.env.json"
  version:     "installs a specific version of Cypress"
}

text = (d) ->
  descriptions[d] ? throw new Error("Could not find description for: #{d}")

module.exports = ->
  ## instantiate a new program for
  ## easier testability
  program = new commander.Command()

  program.version(pkg.version)

  program
    .command("install")
    .description("Installs Cypress")
    .option("-d, --destination <path>", text("destination"))
    .option("--cypress-version <version>", text("version"))
    .action (opts) ->
      require("./commands/install")(parseOpts(opts))

  program
    .command("update")
    .description("Updates Cypress to the latest version")
    .option("-d, --destination <path>", text("destination"))
    .action (opts) ->
      require("./commands/install")(parseOpts(opts))

  program
    .command("run [project]")
    .usage("[project] [options]")
    .description("Runs Cypress Tests Headlessly")
    .option("-s, --spec <spec>",         text("spec"))
    .option("-r, --reporter <reporter>", text("reporter"))
    .option("-p, --port <port>",         text("port"))
    .option("-e, --env <env>",           text("env"))
    .action (project, opts) ->
      require("./commands/run")(project, parseOpts(opts))

  program
    .command("ci [key]")
    .usage("[key] [options]")
    .description("Runs Cypress in CI Mode")
    .option("-r, --reporter <reporter>", text("reporter"))
    .option("-p, --port <port>",         text("port"))
    .option("-e, --env <env vars>",      text("env"))
    .action (key, opts) ->
      require("./commands/ci")(key, parseOpts(opts))

  program
    .command("open")
    .description("Opens Cypress as a regular application")
    .action (key, opts) ->
      require("./commands/open")()

  program
    .command("get:path")
    .description("Returns the default path of the Cypress executable")
    .action (key, opts) ->
      require("./commands/path")()

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

  return program