#!/usr/bin/env node

const sh = require('shelljs')
const utils = require('./utils')
const chalk = require('chalk')
const debug = require('debug')('lint-pre-push')

const start = () => {
  const getFilenames = () => {
    const GIT_PARAMS = (process.env.HUSKY_GIT_PARAMS || 'origin').split(' ')
    const gitRemote = GIT_PARAMS[0]
    const gitBranch = sh.exec(`git branch`).grep(/\*/).split(/\s/)[1]
    const gitRemoteBranch = `${gitRemote}/${gitBranch}`

    debug({ gitRemote })
    debug({ gitBranch })

    return sh
    .exec(`git diff HEAD ${sh.ShellString(gitRemoteBranch)} --name-only`)
    .split('\n')
  }

  return utils.lintFilesByText({
    getFilenames,
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
