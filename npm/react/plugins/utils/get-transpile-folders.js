// @ts-check
const path = require('path')

function getTranspileFolders (config) {
  const rawFolders = config.addTranspiledFolders ?? []
  const folders = rawFolders.map((folder) => path.resolve(config.projectRoot, folder))

  // ensure path is absolute
  // this is going away soon when we drop component and integration folder
  const ensureAbs = (folder) => {
    if (!path.isAbsolute(folder)) {
      return path.resolve(folder)
    }

    return folder
  }

  // user can disable folders, so check first
  if (config.componentFolder) {
    folders.push(ensureAbs(config.componentFolder))
  }

  if (config.fixturesFolder) {
    folders.push(ensureAbs(config.fixturesFolder))
  }

  if (config.supportFolder) {
    folders.push(ensureAbs(config.supportFolder))
  }

  return folders
}

module.exports = { getTranspileFolders }
