module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, options) => {
        // options.args.push('-width', '1280', '-height', '1024')
        // options.args.push('--force-device-scale-factor=2')

        // return options
      })

      return config
    },
  },
}
