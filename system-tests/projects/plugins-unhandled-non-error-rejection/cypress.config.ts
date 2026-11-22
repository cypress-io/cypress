// Captured from esbuild.formatMessages(errors, { kind: 'error', color: false })
const esbuildMessages = [
  '✘ [ERROR] Unexpected "}"\n\n    helper.js:3:0:\n      3 │ }\n        ╵ ^\n\n',
]

export default {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      // Mirrors a watch-mode preprocessor that stores a failed rebuild as a rejected
      // promise of esbuild's formatted messages and never attaches a handler to it
      on('file:preprocessor', () => {
        return new Promise(() => {
          Promise.reject(esbuildMessages)
        })
      })

      return config
    },
  },
}
