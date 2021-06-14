#!/usr/bin/env node

const _ = require('lodash')
const utils = require('./utils')
const sh = require('shelljs')
const chalk = require('chalk')

const start = () => {
  const filesStaged = sh.exec(`git diff --name-only --diff-filter=MA --staged`).split('\n').filter(Boolean)
  const filesUnstaged = sh.exec(`git diff --name-only --diff-filter=M`).split('\n').filter(Boolean)
  const filesPartiallyStaged = _.intersection(filesStaged, filesUnstaged)
  const filesFullyStaged = _.difference(filesStaged, filesPartiallyStaged)

  let fail = false
  let lintedFilesCount = 0

  return utils.lintFilesByName({
    getFilenames: () => filesFullyStaged,
    fix: true,
  })
  .then(({ failed, filenames }) => {
    sh.exec(`git add ${sh.ShellString(filenames.join(' '))}`)

    if (failed) {
      fail = true
    }

    lintedFilesCount += filenames.length

    return
  })
  .then(() => {
    return utils.lintFilesByText({
      getFilenames: () => filesPartiallyStaged,
      getFileText: (f) => sh.exec(`git show :${sh.ShellString(f)}`),
    })
  })
  .then(({ failCount, filenames }) => {
    if (failCount) {
      fail = true
    }

    lintedFilesCount += filenames.length

    return
  })
  .then(() => {
    if (fail) {
      process.exit(1)
    }

    // eslint-disable-next-line no-console
    console.log(chalk.bold(`${chalk.green(lintedFilesCount)} files linted successfully`))

    return
  })
}

if (!module.parent) {
  start()
}

module.exports = { start }
