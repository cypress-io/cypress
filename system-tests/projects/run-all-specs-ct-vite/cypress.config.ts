import { defineConfig } from 'cypress'

export default defineConfig({
  experimentalRunAllSpecs: true,
  component: {
    specPattern: 'component/**/*.cy.tsx',
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
