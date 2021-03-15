import { FileLike, Folder, FolderOrFile } from '../types'

/**
 * Split specs into group by their
 * first level of folder hierarchy
 *
 * @param {Array<{name: string}>} specs
 */
export function makeFileHierarchy (files: FileLike[]) {
  // to save the existing folder paths
  const kvpGroups: { [fullPath: string]: Folder } = {}

  return files.reduce<FolderOrFile[]>((groups, file) => {
    const pathArray = file.name.split('/')
    let currentFileArray: FolderOrFile[] = groups
    let currentPath = ''

    do {
      const pathPart = pathArray.shift() || ''

      currentPath += `/${pathPart}`
      // if we have a file set is as part of the current group
      if (!pathArray.length) {
        currentFileArray.push({
          ...file,
          type: 'file',
          shortName: pathPart,
          currentPath,
        })
      } else if (pathPart) {
        //if it is a folder find if the next folder exists
        let currentGroup: Folder = kvpGroups[currentPath]

        if (!currentGroup) {
          //if it does not exist we create it
          currentGroup = {
            type: 'folder',
            shortName: pathPart,
            files: [],
            isOpen: true,
            name: pathPart,
            currentPath,
          }

          kvpGroups[currentPath] = currentGroup
          // and add it to the current set of objects
          currentFileArray.push(currentGroup)
        }

        currentFileArray = currentGroup.files
      }
    } while (pathArray.length)

    return groups
  }, [])
}
