import path from 'path'
import { defineConfig } from 'cypress'

const __dirname = import.meta.dirname

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    indexHtmlFile: path.join(__dirname, 'index.html'),
    supportFile: path.join(__dirname, 'support.js'),
  },
})
