// @ts-check

'use strict'
const path = require('path')
const {
  SnapshotGenerator,
  prettyPrintError,
  generateBundlerMetadata,
} = require('@tooling/v8-snapshot')

const projectBaseDir = path.join(__dirname, '../')
const snapshotEntryFile = require.resolve('./snapshot.js')
const appEntryFile = require.resolve('../app/index')

const cacheDir = path.resolve(__dirname, '../cache')

;(async () => {
  try {
    const meta = await generateBundlerMetadata(
      projectBaseDir,
      snapshotEntryFile,
      {
        entryFile: appEntryFile,
        nodeModulesOnly: false,
      },
    )

    const snapshotGenerator = new SnapshotGenerator(
      projectBaseDir,
      snapshotEntryFile,
      {
        cacheDir,
        minify: false,
        nodeModulesOnly: false,
        resolverMap: meta.resolverMap,
      },
    )

    await snapshotGenerator.createScript()
    await snapshotGenerator.makeSnapshot()
    snapshotGenerator.installSnapshot()
  } catch (err) {
    prettyPrintError(err, projectBaseDir)
    console.error(err)
  }
})()
