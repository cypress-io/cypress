import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'

const config = {
  external: [
    '@angular/core',
    '@angular/core/testing',
    '@angular/common',
    '@angular/platform-browser-dynamic/testing',
    'zone.js',
    'zone.js/testing',
  ],
}

export default createEntries({ formats: ['es'], input: 'src/index.ts', config })
