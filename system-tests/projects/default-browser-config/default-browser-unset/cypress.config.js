const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        log(str) {
          console.log(str)
          return null
        }
      })
    },
    supportFile: false,
  },
  video: false,
  screenshotOnRunFailure: false,
});
