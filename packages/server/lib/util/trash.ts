import { fs } from './fs'
import os from 'os'
import path from 'path'
import trash from 'trash'
import Bluebird from 'bluebird'

// Moves a folder's contents to the trash (or empties it on Linux)
export const folder = async (pathToFolder: string): Promise<void> => {
  try {
    await fs.statAsync(pathToFolder)

    if (os.platform() === 'linux') {
      await fs.emptyDir(pathToFolder)

      return
    }

    const items = await fs.readdir(pathToFolder)

    await Bluebird.map(items, (item: string) => {
      return trash([path.join(pathToFolder, item)])
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return
    }

    throw error
  }
}

export default {
  folder,
}
