import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    fs: {
      // this is needed to run on CI since we
      // do some magic with symlinks and caching
      // to make everything fast, that Vite does
      // not seem to like.
      // https://vitejs.dev/config/#server-fs-allow
      allow: ['/root/cypress/', '/root/.cache/', '/tmp/', '/Users/', '/private/'],
    },
  },
})
