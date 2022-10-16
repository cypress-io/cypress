import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'lit',
      bundler: 'vite',
    },
  },
})
