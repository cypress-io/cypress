const { defineConfig } = require('cypress')
const { defineConfig: defineViteConfig } = require('vite')
const reactPlugin = require('@vitejs/plugin-react')
const path = require('path')
const fs = require('fs')

const viteConfig = defineViteConfig({
  plugins: [
    reactPlugin({
      jsxRuntime: 'classic',
    }),
  ],
})

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: async (baseConfig) => {
        // to be really sure this was called, write a file to the disc with
        // the initial config
        fs.writeFileSync(path.join(__dirname, 'wrote-to-file'), 'OK')

        return Promise.resolve(viteConfig)
      },
    },
  },
})
