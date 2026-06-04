import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
