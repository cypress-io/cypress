import path from 'path'

export const hideKeys = (token?) => {
  if (!token) {
    return
  }

  if (typeof token !== 'string') {
    // maybe somehow we passes key=true?
    // https://github.com/cypress-io/cypress/issues/14571
    return
  }

  return [
    token.slice(0, 5),
    token.slice(-5),
  ].join('...')
}

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
export const checkIfResolveChangedRootFolder = (resolved, initial) => {
  return path.isAbsolute(resolved) &&
  path.isAbsolute(initial) &&
  !resolved.startsWith(initial)
}
