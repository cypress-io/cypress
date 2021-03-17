import { startDevServer } from '@cypress/vite-dev-server'
import vue from '@vitejs/plugin-vue'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      viteConfig: {
        plugins: [
          vue(),
        ],
      },
    })
  })

  return config
}
