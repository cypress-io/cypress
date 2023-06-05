import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
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
    specPattern: '**/*.cy.ts',
  },
})
