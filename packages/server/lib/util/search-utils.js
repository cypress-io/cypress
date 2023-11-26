const findUp = require('find-up')
const path = require('path')
const fs = require('fs-extra')
const Debug = require('debug')

const debug = Debug('cypress:scaffold-config:searchUtils')

const ROOT_PATHS = [
  '.git',
  'pnpm-workspace.yaml',
  'rush.json',
  'workspace.json',
  'nx.json',
  'lerna.json',
]

function hasWorkspacePackageJson (directory) {
  try {
    const pkg = require(path.join(directory, 'package.json'))

    debug('package file for %s: %o', directory, pkg)

    return !!pkg.workspaces
  } catch (e) {
    debug('error reading package.json in %s. this is not the repository root', directory)

    return false
  }
}

function isRepositoryRoot (directory) {
  if (ROOT_PATHS.some((rootPath) => fs.existsSync(path.join(directory, rootPath)))) {
    return true
  }

  return hasWorkspacePackageJson(directory)
}

function tryToFindPnpFile (projectPath) {
  return findUp((directory) => {
    const isCurrentRepositoryRoot = isRepositoryRoot(directory)

    const file = path.join(directory, '.pnp.cjs')
    const hasPnpCjs = fs.existsSync(file)

    if (hasPnpCjs) {
      return file
    }

    if (isCurrentRepositoryRoot) {
      debug('stopping search at %s because it is believed to be the repository root', directory)

      return findUp.stop
    }

    // Return undefined to keep searching
    return undefined
  }, { cwd: projectPath })
}

module.exports = {
  hasWorkspacePackageJson,
  isRepositoryRoot,
  tryToFindPnpFile,
}
