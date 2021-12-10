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

  // attempt to add directories based on spec pattern
  let componentDirs = config.component.specPattern || ''

  // can be string or array
  if (typeof componentDirs === 'string') {
    componentDirs = [componentDirs]
  }

  const dirsFromSpecPattern = componentDirs.reduce((acc, curr) => {
    // glob
    if (curr.includes('*')) {
      const parts = curr.slice(0, curr.indexOf('*') - 1)
      const joined = parts.split(path.sep)
      const dir = path.join(...joined)

      return acc.concat(path.resolve(config.projectRoot, dir))
    }

    return acc
  }, [])

  return folders.concat(dirsFromSpecPattern)
}

module.exports = { getTranspileFolders }
