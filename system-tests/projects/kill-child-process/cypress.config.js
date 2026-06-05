module.exports = {
  e2e: {
    setupNodeEvents () {
      // This will continually ping unless the child process is killed.
      // Used in require_async_child_spec
      setInterval(() => {
        console.log('Ping...')
      }, 50)
    },
  },
}
