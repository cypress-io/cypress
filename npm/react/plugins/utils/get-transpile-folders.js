// @ts-check
const path = require('path')

function getTranspileFolders (config) {
  const rawFolders = config.addTranspiledFolders ?? []
  const folders = rawFolders.map((folder) => path.resolve(config.projectRoot, folder))

  // user can disable folders, so check first
  if (config.componentFolder) {
    folders.push(path.resolve(config.projectRoot, config.componentFolder))
  }

  if (config.fixturesFolder) {
    folders.push(path.resolve(config.projectRoot, config.fixturesFolder))
  }

  if (config.supportFolder) {
    folders.push(path.resolve(config.projectRoot, config.supportFolder))
  }

  return folders
}

module.exports = { getTranspileFolders }
