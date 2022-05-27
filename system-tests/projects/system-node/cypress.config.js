module.exports = {
  'e2e': {
    'specPattern': 'cypress/e2e/*',
    'supportFile': false,
    setupNodeEvents (on, config) {
      process.stderr.write('Plugin Loaded\n')
      process.stderr.write(`Plugin Node version: ${process.versions.node}\n`)
      process.stderr.write(`Plugin Electron version: ${process.versions.electron}\n`)

      return config
    },
  },
}
