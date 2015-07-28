_       = require("lodash")
program = require("commander")
pkg     = require("../package.json")

parseOpts = (opts) ->
  _.pick(opts, "cypress", "spec", "reporter", "path")

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
  .option("-c, --cypress <path>",      "path to a specific executable Cypress App.")
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

program.parse(process.argv)

if not program.args.length
  program.help()