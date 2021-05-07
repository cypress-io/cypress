// @ts-check
function getTranspileFolders(config) {
  const folders = []

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
