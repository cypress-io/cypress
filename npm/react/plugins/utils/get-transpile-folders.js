// @ts-check
const path = require('path')

function getTranspileFolders (config) {
  const rawFolders = config.addTranspiledFolders ?? []
  const folders = rawFolders.map((folder) => path.resolve(config.projectRoot, folder))

  // ensure path is absolute
  const ensureAbs = (folder) => {
    if (!path.isAbsolute(folder)) {
      return path.resolve(folder)
    }

    return folder
  }

  if (config.fixturesFolder) {
    folders.push(ensureAbs(config.fixturesFolder))
  }

  if (config.supportFolder) {
    folders.push(ensureAbs(config.supportFolder))
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

  return folders.concat(...dirsFromSpecPattern, path.resolve('cypress'))
}

module.exports = { getTranspileFolders }
