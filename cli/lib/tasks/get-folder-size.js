const fs = require('../fs')
const { join } = require('path')
const Bluebird = require('bluebird')

async function getSize (path) {
  const stat = await fs.lstat(path)

  if (stat.isDirectory()) {
    const list = await fs.readdir(path)

    return Bluebird.resolve(list).reduce(async (prev, curr) => {
      const currPath = join(path, curr)

      const s = await fs.lstat(currPath)

      if (s.isDirectory()) {
        return prev + await getSize(currPath)
      }

      return prev + s.size
    }, 0)
  }

  return stat.size
}

module.exports = getSize
