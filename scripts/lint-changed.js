const sh = require('shelljs')
const utils = require('./utils')
const _ = require('lodash')

const start = () => {

  const fix = process.argv.slice(2).includes('--fix')

  return utils.lintFilesByName({
    // list only modified files
    getFilenames: () => {
      return sh.ShellString(
        _.union(
          sh.exec(`git diff --name-only --diff-filter=M`).split('\n'),
          sh.exec(`git diff --name-only --diff-filter=MA --staged`).split('\n')
        )
      )
    },
    fix,
  })
}

if (!module.parent) {
  start()
}

module.exports = { start }
