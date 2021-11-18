import * as fs from 'fs'
import * as path from 'path'

const existsSync = (file: string) => {
  try {
    fs.accessSync(file, fs.constants.F_OK)

    return true
  } catch (_) {
    return false
  }
}

/**
 * Next allows the `pages` directory to be located at either
 * `${projectRoot}/pages` or `${projectRoot}/src/pages`.
 * If neither is found, return projectRoot
 */
export function findPagesDir (projectRoot: string) {
  // prioritize ./pages over ./src/pages
  let pagesDir = path.join(projectRoot, 'pages')

  if (existsSync(pagesDir)) {
    return pagesDir
  }

  pagesDir = path.join(projectRoot, 'src/pages')
  if (existsSync(pagesDir)) {
    return pagesDir
  }

  return projectRoot
}
