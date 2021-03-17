import { startDevServer } from '@cypress/vite-dev-server'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react-refresh'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      viteConfig: {
        plugins: [
          vue(),
          react(),
        ],
      },
    })
  })

  return config
}
