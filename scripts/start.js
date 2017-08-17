const findIndex = require('lodash/findIndex')
const path = require('path')

// if passing the --project or --run-project arg, normalize its value so
// that it's relative to the root and not to packages/server
const projectArgIndex = findIndex(process.argv, (arg) => {
  return arg.includes('--project') || arg.includes('--run-project')
})
if (projectArgIndex > -1) {
  if (process.argv[projectArgIndex].includes('=')) {
    // --project=../foo
    const [arg, projectPath] = process.argv[projectArgIndex].split('=')
    process.argv[projectArgIndex] = `${arg}=${path.resolve(projectPath)}`
  } else {
    // --project ../foo
    const projectPath = process.argv[projectArgIndex + 1]
    // make sure it's the path and not another argument flag
    if (projectPath.substring(0, 2) !== '--') {
      process.argv[projectArgIndex + 1] = path.resolve(projectPath)
    }
  }
}
require('@packages/server')
