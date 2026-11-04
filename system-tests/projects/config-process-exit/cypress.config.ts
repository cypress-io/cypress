export default {
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('task', {
        killConfigProcess () {
          process.kill(process.pid, 'SIGKILL')

          return null
        },
      })

      on('after:spec', () => {})
    },
  },
}
