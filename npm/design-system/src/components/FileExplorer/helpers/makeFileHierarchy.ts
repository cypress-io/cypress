interface BaseNode {
  name: string
  type: 'file' | 'folder'
  absolute: string
}

export interface File extends BaseNode {
  type: 'file'
}

export interface Folder extends BaseNode {
  type: 'folder'
  files: FileNode[]
}

export type FileNode = File | Folder

export function getAllFolders(files: string[]): string[] {
  /**
   * Returns an array of all nested directories given an array of files and folders.
   *  
   * const files = [
   *   'foo.js',
   *   'foo/y/bar.js',
   *   'foo/bar',
   *   'a/b/c',
   * ]
   * 
   * getAllFolders(files) //=> ['foo', 'foo/y', 'foo/bar', 'a', 'a/b', 'a/b/c'])
   */
  const dirs = new Set<string>()
  for (const file of files) {
    const path = file.split('/')
    if (path.length) {
      // Does it contain a file? Assumption: files have an extension. 
      const hasFile = path[path.length - 1].includes('.')

      // Remove file if present.
      const dirOnly = hasFile ? path.splice(0, path.length - 1) : path

      // Add directory to set.
      for (let i = 0; i < dirOnly.length; i++) {
        const dir = dirOnly.slice(0, i + 1)
        dirs.add(dir.join('/'))
      }
    }
  }
  return Array.from(dirs)
}

export function getAllFiles(files: string[]): Record<string, string[]> {
  /**
   * Returns a key/value map of directories to contained files.
   * 
   * {
   *   foo: ['bar.js']
   *   'foo/bar': ['qux.js']
   * }
   */
  const allFiles: Record<string, string[]> = {
    '/': []
  }

  for (const file of files) {
    const split = file.split('/')
    const isFile = split[split.length - 1].includes('.')
    const isRoot = split.length === 1
    const isFileInFolder = split.length > 1 && split[split.length - 1].includes('.')

    if (isFileInFolder) {
      const [file, ...path] = split.reverse()
      const dir = path.reverse().join('/')
      if (!allFiles[dir]) {
        allFiles[dir] = [file]
      } else {
        allFiles[dir] = allFiles[dir].concat(file)
      }
    } 

    if (isFile && isRoot) {
      allFiles['/'] = allFiles['/'].concat(file)
    }
  }

  return allFiles
}

function charCount(str: string, letter: string) {
  let count = 0
  for (let position = 0; position < str.length; position++) {
    if (str.charAt(position) == letter) {
      count += 1
    }
  }
  return count
}

/**
 * Given a list of files and folders, returns an nested array structure
 * representing a file system with use metadata like type, name and absolute.
 * 
 * const files: string[] = ['x/y/z.js']
 * const actual = makeFileHierarchy(files)
 * [
 *   {
 *     name: 'x',
 *     absolute: 'x',
 *     type: 'folder',
 *     files: [
 *       {
 *         name: 'y',
 *         absolute: 'x/y',
 *         type: 'folder',
 *         files: [
 *           {
 *             name: 'z.js',
 *             type: 'file',
 *             absolute: 'x/y/z.js'
 *           }
 *         ],
 *       }
 *     ]
 *   }
 * ]
 */
export function makeFileHierarchy(files: string[]): FileNode[] {
  const allFolders = getAllFolders(files)
  const allFiles = getAllFiles(files)

  const foldersByLength = allFolders.reduce<Record<number, string[]>>((acc, curr) => {
    const count = charCount(curr, '/')
    if (!acc[count]) {
      return { ...acc, [count]: [curr] }
    }
    return { ...acc, [count]: [...acc[count], curr] }
  }, {})

  function walk(dirs: string[], depth = 0): FileNode[] {
    if (!dirs) {
      return []
    }

    return dirs.map(dir => {
      const nestedDirs = foldersByLength[depth + 1]
        ? walk(foldersByLength[depth + 1].filter(x => x.startsWith(dir)), depth + 1)
        : []

      const containedFiles = (allFiles[dir] || []).map<FileNode>(file => ({
        type: 'file',
        name: file,
        absolute: dir + '/' + file
      }))

      const dirname = dir.split('/').reverse()[0]
      return {
        name: dirname,
        files: [...nestedDirs, ...containedFiles],
        type: 'folder',
        absolute: dir
      }
    })
  }

  return walk(foldersByLength[0])
}
