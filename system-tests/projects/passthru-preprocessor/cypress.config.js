module.exports = {
  e2e: {
    setupNodeEvents (on) {
      on('file:preprocessor', ({ filePath }) => filePath)
    },
  },
}
