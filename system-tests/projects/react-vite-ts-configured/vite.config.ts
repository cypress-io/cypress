import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  resolve: {
    alias: {
      // since we run this inside the context of the monorepo,
      // we need to make sure we resolve to the react-dom that is in THIS project and not the monorepo root.
      'react-dom/client': require.resolve('react-dom/client'),
    },
  },
})
