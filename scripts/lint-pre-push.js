const sh = require('shelljs')
const debug = require('debug')('lint-pre-push')
const utils = require('./utils')

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

  }

  return utils.lintFilesByText({
    getFilenames,
    getFileText: (f) => sh.exec(`git show :${sh.ShellString(f)}`),
  })
}

if (!module.parent) {
  start()
}

module.exports = { start }
