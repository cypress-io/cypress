module.exports = (on) => {
  on('before:browser:launch', (browser, launchOptions) => {
    launchOptions.args.push('--auto-open-devtools-for-tabs')

    return launchOptions
  })
}
