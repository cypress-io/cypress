/* eslint-disable quotes */
const sh = require('shelljs')
const utils = require('./utils')

const start = () => {
  return utils.lintFilesByText({
    // list only modified and added files
    getFilenames: () => sh.exec(`git diff --name-only --diff-filter=MA --staged`),
    getFileText: (f) => sh.exec(`git show :${sh.ShellString(f)}`),
  })
}

if (!module.parent) {
  start()
}

module.exports = { start }
