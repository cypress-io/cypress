const { defineConfig } = require('cypress')

module.exports = defineConfig({
  // This property is invalid as `experimentalPromptCommand` is only available for e2e
  experimentalPromptCommand: true,
  e2e: {},
})
