import { FileBase, TreeFolder } from './types'

interface BuildingFile<T extends FileBase> {
  name: string
  path: string
  file: T
}

interface BuildingFolder<T extends FileBase> {
  name: string
  path: string
  /**
   * If undefined, this folder is root
   */
  parent: BuildingFolder<T> | undefined
  files: Array<BuildingFile<T>>
  folders: Record<string, BuildingFolder<T>>
}

const treeToFolders = <T extends FileBase>({ path, name, files, folders }: BuildingFolder<T>): TreeFolder<T> => {
  return {
    id: path,
    name,
    children: [...Object.values(folders).map(treeToFolders), ...files.map(({ path, name, file }) => {
      return {
        id: path,
        name,
        file,
      }
    })],
  }
}

const compressTree = <T extends FileBase>(folder: BuildingFolder<T>) => {
  while (Object.keys(folder.folders).length === 1 && folder.files.length < 1) {
    // Not root, has only one folder child and no file children
    const child = folder.folders[Object.keys(folder.folders)[0]]

    folder.folders = child.folders
    folder.files = child.files
    folder.path = child.path
    folder.name = `${folder.name}/${child.name}`
    child.parent = folder.parent
  }

  for (const childKey of Object.keys(folder.folders)) {
    compressTree(folder.folders[childKey])
  }
}

export const buildTree = <T extends FileBase>(files: T[], rootDirectory: string) => {
  const rootPathParts = rootDirectory.split('/')

  const lastRootPart = rootPathParts[rootPathParts.length - 1]

  const rootName = lastRootPart
    ? lastRootPart
    : rootPathParts.length > 1
      ? rootPathParts[rootPathParts.length - 2]
      // If no root path, use empty string as root
      : ''

  const rootFolder: BuildingFolder<T> = {
    path: rootDirectory,
    name: rootName,
    files: [],
    folders: {},
    parent: undefined,
  }

  for (const file of files) {
    let parentDirectory = rootFolder

    // All paths should be POSIX compliant
    const pathParts = file.path.split('/')

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]

      if (i === pathParts.length - 1) {
        // Last item, filename
        parentDirectory.files.push({
          path: file.path,
          name: part,
          file,
        })
      } else {
        if (part in parentDirectory.folders) {
          // Directory already exists, switch to new parent
          parentDirectory = parentDirectory.folders[part]
        } else {
          // Directory hasn't been seen before
          const newDirectory: BuildingFolder<T> = {
            path: pathParts.slice(0, i + 1).join('/'),
            name: part,
            files: [],
            folders: {},
            parent: parentDirectory,
          }

          parentDirectory.folders[part] = newDirectory
          parentDirectory = newDirectory
        }
      }
    }
  }

  compressTree(rootFolder)

  return treeToFolders(rootFolder)
}
