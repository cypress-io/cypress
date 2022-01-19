import { defineConfig } from 'cypress'

export default defineConfig({
  'baseUrl': '<%= baseUrl%>',
  'e2e': {
    'supportFile': '<%= root%>cypress/support/e2e.ts',
    'videosFolder': '<%= root%>cypress/videos',
    'screenshotsFolder': '<%= root%>cypress/screenshots',
    'pluginsFile': '<%= root%>cypress/plugins/index.ts',
    'fixturesFolder': '<%= root%>cypress/fixtures',
  },
})
