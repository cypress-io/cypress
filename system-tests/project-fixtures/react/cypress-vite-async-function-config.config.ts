import { defineConfig } from 'cypress'
import reactPlugin from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import * as path from 'path'
import * as fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: async () => {
        // to be really sure this was called, write a file to the disc with
        // the initial config
        fs.writeFileSync(path.join(__dirname, 'wrote-to-file'), 'OK')

        // inline vite config via async function
        return Promise.resolve({
          plugins: [
            reactPlugin({
              jsxRuntime: 'classic',
            }),
          ],
        })
      },
    },
  },
})
