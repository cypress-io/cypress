const minimist = require('minimist')

const args = minimist(process.argv.slice(2))

function installingFromNpmAsAUser () {
  // when installing this CLI package from
  // another project, the cwd will not match
  // __dirname
  return process.cwd() !== __dirname
}

switch (args.exec) {
  case 'install':
    // only go out and download the cypress
    // binary if we're consuming this as an
    // npm package
    if (installingFromNpmAsAUser()) {
      require('./lib/download').install()
    }
    break
  default:
    require('./lib/cli').init()
}
