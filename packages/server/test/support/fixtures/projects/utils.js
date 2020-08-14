module.exports = {
  useFixedFirefoxResolution (browser, options, config) {
    if (browser.family === 'firefox' && !config.env['NO_RESIZE']) {
      // this is needed to ensure correct error screenshot / video recording
      // resolution of exactly 1280x720 (height must account for firefox url bar)
      options.args = options.args.concat(
        ['-width', '1280', '-height', '794'],
      )
    }
  },
}
