import { defineConfig } from 'cypress'
const { projects } = require('./angular.json')

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
      options: {
        projectConfig: {
          root: projects.angular.root,
          sourceRoot: projects.angular.sourceRoot,
          buildOptions: {
            ...projects.angular.architect.custom.options,
            ...projects.angular.architect.custom.configurations.development,
          },
        },
      },
      webpackConfig: {
        resolve: {
          alias: {
            '@angular/common': require.resolve('@angular/common'),
            '@angular/core/testing': require.resolve('@angular/core/testing'),
            '@angular/core': require.resolve('@angular/core'),
            '@angular/platform-browser/testing': require.resolve('@angular/platform-browser/testing'),
            '@angular/platform-browser': require.resolve('@angular/platform-browser'),
            '@angular/platform-browser-dynamic/testing': require.resolve('@angular/platform-browser-dynamic/testing'),
            '@angular/platform-browser-dynamic': require.resolve('@angular/platform-browser-dynamic'),
            'zone.js/testing': require.resolve('zone.js/dist/zone-testing'),
            'zone.js': require.resolve('zone.js'),
          },
        },
      },
    },
    specPattern: 'src/**/*.cy.ts',
  },
})
