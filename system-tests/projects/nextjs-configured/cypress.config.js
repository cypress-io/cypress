import { defineConfig } from 'cypress'
import path from 'path'

export default defineConfig({
  allowCypressEnv: false,
  fixturesFolder: false,
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
      webpackConfig: {
        resolve: {
          alias: {
            'react': path.resolve(import.meta.dirname, './node_modules/react'),
            'react-dom': path.resolve(import.meta.dirname, './node_modules/react-dom'),
          },
        },
      },
    },
  },
})
