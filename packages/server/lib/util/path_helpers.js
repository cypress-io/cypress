const path = require('path')
const { fs } = require('./fs')

// require.resolve walks the symlinks, which can really change
// the results. For example
//  /tmp/foo is symlink to /private/tmp/foo on Mac
// thus resolving /tmp/foo to find /tmp/foo/index.js
// can return /private/tmp/foo/index.js
// which can really confuse the rest of the code.
// Detect this switch by checking if the resolution of absolute
// paths moved the prefix
//
// Good case: no switcheroo, return false
//   /foo/bar -> /foo/bar/index.js
// Bad case: return true
//   /tmp/foo/bar -> /private/tmp/foo/bar/index.js
const checkIfResolveChangedRootFolder = (resolved, initial) => {
  return path.isAbsolute(resolved) &&
  path.isAbsolute(initial) &&
  !resolved.startsWith(initial)
}

// real folder path found could be different due to symlinks
// For example, folder /tmp/foo on Mac is really /private/tmp/foo
const getRealFolderPath = (folder) => {
  // TODO check if folder is a non-empty string
  if (!folder) {
    throw new Error('Expected folder')
  }

  return fs.realpathAsync(folder)
}

module.exports = {
  checkIfResolveChangedRootFolder,

  getRealFolderPath,
}
