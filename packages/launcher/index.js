// @ts-check

// compile TypeScript files on the fly using
// Node require hook project
require('../ts/register')
const launcher = require("./lib/launcher")
module.exports = launcher

if (!module.parent) {
  // quick way to check if TS is working
  console.log('Launcher project exports')
  console.log(launcher)
  console.log('⛔️ please use it as a module, not from CLI')
  launcher.detect().then(browsers => {
    console.log('detected %d browser(s)', browsers.length)
    console.log(browsers)
  }, console.error)
}
