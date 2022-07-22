'use strict'
// @ts-check

const fs = require('fs-extra')
const path = require('path')

const debug = require('debug')
const { ensureDirSync } = require('v8-snapshot')
const logInfo = debug('snapgen:info')
const logError = debug('snapgen:error')

/**
 * Saves the obtained metafile to previous.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
async function saveMetaFileToPrev ({ snapshotMetaFile, snapshotMetaPrevFile }) {
  try {
    logInfo('Saving meta file to "%s"', snapshotMetaPrevFile)
    await fs.copyFile(snapshotMetaFile, snapshotMetaPrevFile)

    return 0
  } catch (err) {
    logError(err)

    return 1
  }
}

function ensureParentDir (filePath) {
  const dir = path.dirname(filePath)

  ensureDirSync(dir)
}

module.exports = { ensureParentDir, saveMetaFileToPrev }
