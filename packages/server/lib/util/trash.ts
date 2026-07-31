import { fs } from './fs'
import os from 'os'
import path from 'path'
import trash from 'trash'

// Trashes a single item, tolerating the case where the underlying trash
// implementation reports a failure even though the item was actually removed.
// On Windows, when the Recycle Bin is configured with "Don't move files to the
// Recycle Bin. Remove files immediately when deleted.", windows-trash.exe
// deletes the file but exits with a non-zero code, which `trash` surfaces as an
// error. If the item no longer exists, the removal succeeded and we should not
// warn.
const trashItem = async (itemPath: string): Promise<void> => {
  try {
    await trash([itemPath])
  } catch (error) {
    if (await fs.pathExists(itemPath)) {
      throw error
    }
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
