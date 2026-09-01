import fs from 'fs-extra'
import { join } from 'path'

/**
 * Get the size of a folder or a file.
 *
 * This function returns the actual file size of the folder (size), not the allocated space on disk (size on disk).
 * For more details between the difference, check this link:
 * https://www.howtogeek.com/180369/why-is-there-a-big-difference-between-size-and-size-on-disk/
 *
 * @param {string} path path to the file or the folder.
 */
async function getSize (path: string): Promise<number> {
  const stat = await fs.lstat(path)

  if (stat.isDirectory()) {
    const list = await fs.readdir(path)
    let total = 0

    for (const entry of list) {
      const entryPath = join(path, entry)
      const entryStat = await fs.lstat(entryPath)

      total += entryStat.isDirectory() ? await getSize(entryPath) : entryStat.size
    }

    return total
  }

  return stat.size
}

export default getSize
