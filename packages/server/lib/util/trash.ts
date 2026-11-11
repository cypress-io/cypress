import { fs } from './fs'
import os from 'os'
import path from 'path'
import { shell } from 'electron'

const trashItem = async (itemPath: string): Promise<void> => {
  try {
    await shell.trashItem(itemPath)
  } catch (error) {
    // Windows rejects without deleting when the Recycle Bin is set to remove files immediately
    if (os.platform() !== 'win32') {
      throw error
    }

    await fs.remove(itemPath)
  }
}

// Moves a folder's contents to the trash (or empties it on Linux)
export const folder = async (pathToFolder: string): Promise<void> => {
  try {
    await fs.statAsync(pathToFolder)

    if (os.platform() === 'linux') {
      await fs.emptyDir(pathToFolder)

      return
    }

    const items = await fs.readdir(pathToFolder)

    await Promise.all(items.map((item: string) => {
      return trashItem(path.join(pathToFolder, item))
    }))
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
