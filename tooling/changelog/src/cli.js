const commander = require('commander')
const debug = require('debug')('tooling:changelog')
const addChangeset = require('./add-changeset')
const createChangelog = require('./create-changelog')

const createProgram = () => {
  const program = new commander.Command()

  // bug in commander not printing name
  // in usage help docs
  program._name = 'changelog'

  program.usage('<command> [options]')

  return program
}

module.exports = {
  /**
   * Parses the command line and kicks off Cypress process.
   */
  init (args) {
    if (!args) {
      args = process.argv
    }

    const program = createProgram()

    program
    .command('help')
    .description('Shows CLI help and exits')
    .action(() => {
      program.help()
    })

    program
    .command('add-change')
    .description('add a new changelog entry')
    .usage('[type message]')
    .option('-t, --type [type]', 'What type of change is this?')
    .option('-m, --message [words...]', 'What was changed?')
    .action(addChangeset)

    program
    .command('create-changelog')
    .description('Determines next Cypress version & creates the changelog for the release.')
    .action(createChangelog)

    debug('program parsing arguments')

    return program.parse(args)
  },
}

// @ts-ignore
if (!module.parent) {
  console.error('This CLI module should be required from another Node module')
  console.error('and not executed directly')

  process.exit(-1)
}
