module.exports = {
  useFixedBrowserLaunchSize (browser, options, config) {
    if (config.env['NO_RESIZE']) return

    if (browser.family === 'firefox') {
      options.args.push('-width', '1280', '-height', '720')
    } else if (browser.name === 'electron') {
      options.preferences.width = 1280
      options.preferences.height = 720
    } else if (browser.family === 'chromium') {
      options.args.push('--window-size=1280,720')
    }
  },
}
