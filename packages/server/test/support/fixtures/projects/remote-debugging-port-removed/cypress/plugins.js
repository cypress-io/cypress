const la = require('lazy-ass')

module.exports = (on) => {
  on('before:browser:launch', (browser = {}, options) => {
    la(browser.family === 'chromium', 'this test can only be run with a chromium-family browser')

    const cdpArg = process.env.CY_REMOVE_PIPE ? '--remote-debugging-pipe' : '--remote-debugging-port'

    // remove debugging pipe or port so that the browser connection fails
    const newArgs = options.args.filter((arg) => !arg.startsWith(cdpArg))

    la(newArgs.length === options.args.length - 1, 'exactly one argument should have been removed')

    options.args = newArgs

    return options
  })
}
