import { defineConfig } from 'cypress'
import react from '@vitejs/plugin-react'
import { CypressMocks } from './src'

export default defineConfig({
  projectId: 'ypt4pf',
  component: {
    supportFile: false,
    specPattern: 'cypress/component/**/*.cy.ts*',
    devServer: {
      bundler: 'vite',
      framework: 'react',
      viteConfig: () => {
        return {
          plugins: [
            react({
              jsxRuntime: 'classic',
            }),
            CypressMocks(),
          ],
        }
      },
    },
  },
})
