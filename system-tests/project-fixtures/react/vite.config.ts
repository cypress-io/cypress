import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // this is needed to run on CI since we
      // use symlinks and caching
      // https://vitejs.dev/config/#server-fs-allow
      allow: ['/root/cypress/', '/root/.cache/', '/tmp/', '/Users/', '/private/'],
    },
  },
})
