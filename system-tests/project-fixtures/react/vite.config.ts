import { defineConfig } from 'vite'
import * as React from 'react'

const alias: Record<string, string> = {
  'react': require.resolve('react'),
}

if (React.version.startsWith('18')) {
  // Only needed for React 18+
  alias['react-dom/client'] = require.resolve('react-dom/client')
}

// This is intentionally added *after* the react-dom/client alias.
// Otherwise it won't resolve correctly.
alias['react-dom'] = require.resolve('react-dom')

export default defineConfig({
  resolve: {
    alias,
  },
  logLevel: 'silent',
})
