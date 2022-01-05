import { defineConfig } from 'cypress'

export default defineConfig({
  'integrationFolder': '<%= root%>cypress/integration',
  'supportFile': '<%= root%>cypress/support/component.ts',
  'videosFolder': '<%= root%>cypress/videos',
  'screenshotsFolder': '<%= root%>cypress/screenshots',
  'pluginsFile': '<%= root%>cypress/plugins/index.ts',
  'fixturesFolder': '<%= root%>cypress/fixtures',
  'baseUrl': '<%= baseUrl%>',
})
