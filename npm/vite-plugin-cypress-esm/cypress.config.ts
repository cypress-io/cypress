import { defineConfig } from 'cypress'
import react from '@vitejs/plugin-react'
import { CypressEsm } from './src'

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
            react(),
            CypressEsm({
              ignoreModuleList: ['**/ignoreModuleList.cy.ts', '*MyAsync*'],
              // For `cypress/react` on react 18+, we need to ignore transforming the react-dom/client library
              ignoreImportList: ['**/ImmutableModuleB*', '**/react-dom/client'],
            }),
          ],
        }
      },
    },
  },
})
