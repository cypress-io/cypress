#!/usr/bin/env node

/* eslint-disable quotes */
const sh = require('shelljs')
const utils = require('./utils')
const chalk = require('chalk')

const start = () => {
  return utils.lintFilesByText({
    // list only modified and added files
    getFilenames: () => sh.exec(`git diff --name-only --diff-filter=MA --staged`).split('\n'),
    getFileText: (f) => sh.exec(`git show :${sh.ShellString(f)}`),
  })
  .then(({ failCount, filenames }) => {
    if (failCount) {
      process.exit(failCount)
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
