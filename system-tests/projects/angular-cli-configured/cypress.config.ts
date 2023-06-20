import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts',
  },
})
