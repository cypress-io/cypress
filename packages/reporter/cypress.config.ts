import { defineConfig } from 'cypress'
import webpackConfig from './webpack.config'
import WP from '../../npm/webpack-preprocessor'

export default defineConfig({
  projectId: 'ypt4pf',
  reporter: '../../node_modules/cypress-multi-reporters/index.js',

  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },

  retries: {
    runMode: 2,
    openMode: 0,
  },

  videoCompression: false, // turn off video compression for CI

  e2e: {
    experimentalStudio: true,
    baseUrl: 'http://localhost:5006',
    setupNodeEvents (on, config) {
      const express = require('express')

      express().use(express.static('dist')).listen(5006)

      on('file:preprocessor', WP({
        webpackOptions: webpackConfig,
      }))

      return config
    },
    viewportHeight: 660,
    viewportWidth: 400,
  },

  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig,
    },
  },
})
