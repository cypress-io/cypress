import { defineConfig } from 'cypress'

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
  e2e: {
    baseUrl: 'http://localhost:5006',
    setupNodeEvents (_on, config) {
      const express = require('express')

      express().use(express.static('dist')).listen(5006)

      return config
    },
    viewportHeight: 660,
    viewportWidth: 400,
  },
})
