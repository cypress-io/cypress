const la = require('lazy-ass')

module.exports = (on) => {
  on('before:browser:launch', (browser = {}, args) => {
    la(browser.family === 'chromium', 'this test can only be run with a chromium-family browser')

    // remove debugging port so that the browser connection fails
    const newArgs = args.filter((arg) => !arg.startsWith('--remote-debugging-port='))

    la(newArgs.length === args.length - 1, 'exactly one argument should have been removed')

    return newArgs
  })
}
