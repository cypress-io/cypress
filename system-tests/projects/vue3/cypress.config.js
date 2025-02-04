import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
