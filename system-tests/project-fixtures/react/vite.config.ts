import { defineConfig } from 'vite'
import * as React from 'react'

const alias: Record<string, string> = {
  'react': require.resolve('react'),
  'react-dom': require.resolve('react-dom'),
}

if (React.version.startsWith('18')) {
  // Only needed for React 18+
  alias['react-dom/client'] = require.resolve('react-dom/client')
}

export default defineConfig({
  resolve: {
    alias,
  },
  logLevel: 'silent',
})
