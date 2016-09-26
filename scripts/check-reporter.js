// check if reporter is linked before releasing
// if it is, we don't want to release
// the reporter needs to be the prod version from npm

var fs = require('fs')

function bail (err) {
  console.error("!!!!!!!!!!!!!!")
  console.error("!!!!!!!!!!!!!!")
  console.error()
  console.error(err)
  console.error()
  console.error("!!!!!!!!!!!!!!")
  console.error("!!!!!!!!!!!!!!")
  process.exit(1)
}

try {
  var stats = fs.lstatSync('node_modules/@cypress/core-reporter')
  if (stats.isSymbolicLink()) {
    bail('The reporter is linked. It needs to be properly installed through npm before releasing.')
  } else {
    process.exit(0)
  }
} catch (e) {
  // reporter isn't installed at all, that's no good
  bail('The reporter is not installed. Run "npm install" before releasing.')
}
