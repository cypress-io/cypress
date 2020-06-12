const path = require('path')

// helper for resolving to the current working directory
// since electron does not play nice with process.cwd()
// this function should always return path.dirname('package.json')
const appPath = (function () {
  // if lib is our basename then we haven't
  // been concatted or moved and we need to
  // walk up one folder to access our app path
  if (path.basename(__dirname) === 'lib') {
    return path.join(__dirname, '..')
  }

  // we are already in the app path
  return __dirname
})()

// after we figure out our appPath
// if the process.cwd() isnt set to that
// then change it
if (process.cwd() !== appPath) {
  process.chdir(appPath)
}

module.exports = (...args) => {
  return path.join(appPath, ...args)
}
