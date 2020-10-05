const fs = require('../fs')
const { join } = require('path')
const Bluebird = require('bluebird')

/**
 * Get the size of a folder or a file.
 *
 * This function returns the actual file size of the folder (size), not the allocated space on disk (size on disk).
 * For more details between the difference, check this link:
 * https://www.howtogeek.com/180369/why-is-there-a-big-difference-between-size-and-size-on-disk/
 *
 * @param {string} path path to the file or the folder.
 */
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
