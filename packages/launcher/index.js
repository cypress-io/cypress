// @ts-check

// compile TypeScript files on the fly using
// Node require hook project
if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('@packages/ts/register')
}

const launcher = require('./lib/launcher')

module.exports = launcher

if (!module.parent) {
  const Bluebird = require('bluebird')

  // quick way to check if TS is working
  /* eslint-disable no-console */
  console.log('Launcher project exports')
  console.log(launcher)
  console.log('⛔️ please use it as a module, not from CLI')

  if (process.argv.length > 2) {
    const filenames = process.argv.slice(2)

    Bluebird.each(filenames, (filename) => {
      launcher.detectByPath(filename)
      .then((foundBrowser) => {
        console.log(` 👍 Found "${filename}":`, foundBrowser)
      })
      .catch((err) => {
        console.log(` 👎 Couldn't find "${filename}:"`, err.message)
      })
    })
  } else {
    launcher.detect().then((browsers) => {
      console.log('detected %s', browsers.length === 1 ? 'browser' : 'browsers')
      console.log(browsers)
    }, console.error)
  }
  /* eslint-enable no-console */
}
