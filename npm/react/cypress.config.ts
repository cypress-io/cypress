import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  viewportWidth: 400,
  viewportHeight: 400,
  projectId: 'z9dxah',
  component: {
    experimentalSingleTabRunMode: true,
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
      'examples/**/*',
    ],
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
