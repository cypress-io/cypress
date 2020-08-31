const execa = require('execa')
const chalk = require('chalk')

const SEMANTIC_PREFIX = 'semantic-release'
const STEP_PREFIX = /((Completed|Start) step)/
const INFO_CHAR = 'ℹ  '
const RELEASE_PREFIX = 'Release note for version'
const NO_RELEASE_PREFIX = 'There are no relevant changes, so no new version is released.'

/* eslint-disable no-console */

const main = async () => {
  const { argv } = process
  const pack = argv[2]

  if (!pack) {
    throw new Error('Please specify a package to release.')
  }

  const { stdout } = await execa('lerna', ['exec', '--scope', pack, '--', 'npx', '--no-install', 'semantic-release', '--dry-run'])

  const packOut = `[${chalk.yellowBright.bold(pack)}]`
  let notesOut = false

  stdout.split('\n')
  .filter((o) => !o.match(STEP_PREFIX) && (!o.includes(SEMANTIC_PREFIX) || o.includes(INFO_CHAR)))
  .map((o) => o.split(INFO_CHAR).pop())
  .forEach((o) => {
    if (o.includes(RELEASE_PREFIX)) {
      console.log(packOut, chalk.greenBright.bold(o))
      notesOut = true
    } else if (o.includes(NO_RELEASE_PREFIX)) {
      console.log(packOut, chalk.redBright.bold(o))
      notesOut = true
    } else {
      console.log(!notesOut ? packOut : '', o)
    }
  })
}

main()
