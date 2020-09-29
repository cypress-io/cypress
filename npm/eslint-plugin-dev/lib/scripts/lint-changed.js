#!/usr/bin/env node

const sh = require('shelljs')
const utils = require('./utils')
const _ = require('lodash')
const chalk = require('chalk')

const start = () => {
  const fix = process.argv.slice(2).includes('--fix')

  return utils.lintFilesByName({
    // list only modified files
    getFilenames: () => {
      return _.union(
        sh.exec(`git diff --name-only --diff-filter=M`).split('\n'),
        sh.exec(`git diff --name-only --diff-filter=MA --staged`).split('\n'),
      )
    },
    fix,
  })
  .then(({ failed, filenames }) => {
    if (failed) {
      process.exit(failed)
    }

    // eslint-disable-next-line no-console
    console.log(chalk.bold(`${chalk.green(filenames.length)} files linted successfully`))

    return
  })
}

if (!module.parent) {
  start()
}

module.exports = { start }
