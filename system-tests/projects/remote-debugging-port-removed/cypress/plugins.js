const la = require('lazy-ass')

module.exports = (on) => {
  on('before:browser:launch', (browser = {}, options) => {
    la(browser.family === 'chromium', 'this test can only be run with a chromium-family browser')

    // remove debugging port so that the browser connection fails
    const newArgs = options.args.filter((arg) => !arg.startsWith('--remote-debugging-port='))

    la(newArgs.length === options.args.length - 1, 'exactly one argument should have been removed')

    options.args = newArgs

    return options
  })
}
