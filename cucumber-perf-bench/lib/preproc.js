'use strict'

const path = require('node:path')

// Direct handles to the BUILT preprocessor internals (bypassing the package
// exports map, which only exposes subpath-entrypoints). The clone lives at
// ../preprocessor-src by default (see setup.sh); override with PREPROCESSOR_SRC.
const SRC = process.env.PREPROCESSOR_SRC || path.join(__dirname, '..', 'preprocessor-src')
const DIST = path.join(SRC, 'dist')

module.exports = {
  SRC,
  DIST,
  template: require(path.join(DIST, 'template.js')),
  registry: require(path.join(DIST, 'registry.js')),
  stepDefinitions: require(path.join(DIST, 'step-definitions.js')),
  esbuildEntry: require(path.join(DIST, 'subpath-entrypoints', 'esbuild.js')),
  webpackLoaderPath: path.join(DIST, 'subpath-entrypoints', 'webpack.js'),
}
