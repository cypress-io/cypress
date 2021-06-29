const supportedConfigFiles = [
  'cypress.json',
  'cypress.config.js',
]

/**
 * Since we load the cypress.json via `require`,
 * we need to clear the `require.cache` before/after some tests
 * to ensure we are not using a cached configuration file.
 */
const clearCypressJsonCache = () => {
  Object.keys(require.cache).forEach((key) => {
    if (supportedConfigFiles.some((file) => key.includes(file))) {
      delete require.cache[key]
    }
  })
}

module.exports = { clearCypressJsonCache }
