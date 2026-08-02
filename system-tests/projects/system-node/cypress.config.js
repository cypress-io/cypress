module.exports = {
  'allowCypressEnv': false,
  'e2e': {
    'specPattern': 'cypress/e2e/*',
    'supportFile': false,
    setupNodeEvents (on, config) {
      // Emit the diagnostics the system test asserts on as a single write so they cross the
      // stderr pipe as one chunk, rather than three separate writes that can be split and
      // relayed independently (which intermittently dropped the middle line).
      process.stderr.write([
        'Plugin Loaded',
        `Plugin Node version: ${process.versions.node}`,
        `Plugin Electron version: ${process.versions.electron}`,
        '',
      ].join('\n'))

      return config
    },
  },
}
