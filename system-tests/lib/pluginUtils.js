module.exports = {
  useFixedBrowserLaunchSize (browser, options, config) {
    if (config.env['NO_RESIZE']) return

    if (browser.family === 'firefox') {
      // this is needed to ensure correct error screenshot / video recording
      // resolution of exactly 1280x720
      // (height must account for firefox url bar, which we can only shrink to 1px ,
      // and the total size of the window url and tab bar, which is 85 pixels for a total offset of 86 pixels)
      options.args.push(
        '-width', '1280', '-height', '806',
      )
    } else if (browser.name === 'electron') {
      options.preferences.width = 1280
      options.preferences.height = 720
    } else if (browser.family === 'chromium') {
      options.args.push('--window-size=1280,720')
    }
  },
}
