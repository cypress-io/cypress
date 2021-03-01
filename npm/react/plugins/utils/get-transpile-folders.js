// @ts-check
function getTranspileFolders (config) {
  const folders = []

  // user can disable folders, so check first
  if (config.componentFolder) {
    folders.push(config.componentFolder)
  }

  if (config.fixturesFolder) {
    folders.push(config.fixturesFolder)
  }

  return folders
}

module.exports = { getTranspileFolders }
