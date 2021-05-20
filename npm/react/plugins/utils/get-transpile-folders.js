// @ts-check
const path = require('path')

function getTranspileFolders (config) {
  const rawFolders = config.addTranspiledFolders ?? []
  const folders = rawFolders.map((folder) => path.resolve(config.projectRoot, folder))

  // user can disable folders, so check first
  if (config.componentFolder) {
    folders.push(config.componentFolder)
  }

  if (config.fixturesFolder) {
    folders.push(config.fixturesFolder)
  }

  if (config.supportFolder) {
    folders.push(config.supportFolder)
  }

  return folders
}

module.exports = { getTranspileFolders }
