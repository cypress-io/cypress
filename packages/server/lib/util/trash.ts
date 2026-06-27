import { fs } from './fs'
import os from 'os'
import path from 'path'
import trash from 'trash'

// Trashes a single item, falling back to a permanent delete when trashing
// fails. `trash` shells out to native helpers (`macos-trash`, `win-trash.exe`)
// that fail in many environments: macOS on Apple Silicon without Rosetta
// (`spawn Unknown system error -86`), Windows refusing to trash nested folders,
// root-owned directories, and so on. Since the only goal here is to clear stale
// run results before a run, a trash failure should never block cleanup or
// surface a stack trace. If the item is already gone (e.g. Windows configured to
// delete immediately makes win-trash.exe exit non-zero after removing it) we're
// done; otherwise remove it permanently.
const trashItem = async (itemPath: string): Promise<void> => {
  try {
    await trash([itemPath])
  } catch (error) {
    if (await fs.pathExists(itemPath)) {
      await fs.remove(itemPath)
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
