import { defineConfig } from 'vite'

export default defineConfig({
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
