'use strict'
// @ts-check

const genMeta = require('./gen-meta')
const genEntry = require('./gen-entry')
const installSnapshot = require('./install-snapshot')
const { saveMetaFileToPrev } = require('./util')
const { consolidateDeps } = require('./consolidate-deps')

module.exports = async function setup (config) {
  consolidateDeps(config)

  const meta = await genMeta(config)

  await genEntry(config)
  await installSnapshot(config, meta.resolverMap)

  saveMetaFileToPrev(config)
}
