const path = require('path')
const fs = require('fs')

/** @type {(file: string) => boolean} */
const existsSync = (file) => {
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
 * @param {string} projectRoot
 * @returns string
 */
function findPagesDir (projectRoot) {
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

module.exports.findPagesDir = findPagesDir
