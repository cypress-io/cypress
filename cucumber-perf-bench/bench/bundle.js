'use strict'

// Bench A — the user-facing cost (#336/#587): per-spec bundling time + output
// size, comparing esbuild vs webpack and global vs scoped step definitions.
// Each feature is bundled separately to mirror Cypress's one-bundle-per-spec
// model.

const os = require('node:os')
const fs = require('node:fs')
const path = require('node:path')
const esbuild = require('esbuild')
const webpack = require('webpack')
const { esbuildEntry, webpackLoaderPath } = require('../lib/preproc')
const { makeConfig } = require('../lib/makeConfig')

async function bundleEsbuild (root, featurePaths) {
  const cfg = makeConfig(root, { tracking: false })
  const plugin = esbuildEntry.createEsbuildPlugin(cfg)

  let totalBytes = 0
  const t0 = performance.now()
  for (const feature of featurePaths) {
    const result = await esbuild.build({
      entryPoints: [feature],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      logLevel: 'silent',
      absWorkingDir: root,
      plugins: [plugin],
    })
    totalBytes += result.outputFiles[0].contents.length
  }
  const ms = performance.now() - t0
  return { ms, totalBytes, count: featurePaths.length }
}

function bundleOneWebpack (root, feature, cfg, outDir) {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      mode: 'development',
      devtool: false,
      entry: feature,
      context: root,
      output: { path: outDir, filename: path.basename(feature) + '.js' },
      resolve: { extensions: ['.js', '.json'] },
      module: {
        rules: [
          { test: /\.feature$/, use: [{ loader: webpackLoaderPath, options: cfg }] },
        ],
      },
      stats: 'errors-only',
      infrastructureLogging: { level: 'error' },
    })

    compiler.run((err, stats) => {
      if (err) return reject(err)
      if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')))
      const file = path.join(outDir, path.basename(feature) + '.js')
      const bytes = fs.statSync(file).size
      compiler.close(() => resolve(bytes))
    })
  })
}

async function bundleWebpack (root, featurePaths) {
  const cfg = makeConfig(root, { tracking: false })
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-'))
  let totalBytes = 0
  const t0 = performance.now()
  for (const feature of featurePaths) {
    totalBytes += await bundleOneWebpack(root, feature, cfg, outDir)
  }
  const ms = performance.now() - t0
  fs.rmSync(outDir, { recursive: true, force: true })
  return { ms, totalBytes, count: featurePaths.length }
}

module.exports = { bundleEsbuild, bundleWebpack }
