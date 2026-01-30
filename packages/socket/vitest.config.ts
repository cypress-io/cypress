import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'socket.io-parser': path.resolve(__dirname, 'node_modules/socket.io-parser'),
    },
  },
  test: {
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
