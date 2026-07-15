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

// True when trashing `folderToTrash` would remove the project itself — i.e. the
// folder is the project root or an ancestor of it. Guards against a
// misconfigured assets folder, e.g. `downloadsFolder: ''` resolves to the
// project root and `'../'` to its parent, either of which would empty the whole
// project (including .git). See https://github.com/cypress-io/cypress/issues/26393
export const wouldTrashProjectRoot = (folderToTrash: string, projectRoot: string): boolean => {
  const resolvedFolder = path.resolve(folderToTrash)
  const resolvedProjectRoot = path.resolve(projectRoot)

  if (resolvedFolder === resolvedProjectRoot) {
    return true
  }

  // The project root resolves to a location inside the folder we are about to
  // trash, so the folder is an ancestor of the project. Mirrors the isInsideDir
  // path-traversal idiom used elsewhere in the server package.
  const relativeToFolder = path.relative(resolvedFolder, resolvedProjectRoot)

  return relativeToFolder !== '' && !relativeToFolder.startsWith('..') && !path.isAbsolute(relativeToFolder)
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
  wouldTrashProjectRoot,
}
