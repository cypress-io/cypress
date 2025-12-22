import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalRunAllSpecs: true,
    specPattern: 'component/**/*.cy.jsx',
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
})
