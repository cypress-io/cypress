'use strict'

// @ts-check

const path = require('path')
const fs = require('fs')
const { sync: glob } = require('glob')

const debug = require('debug')
const logInfo = debug('snapgen:info')
const logError = debug('snapgen:error')

/**
 * Remove all bluebird installations used by the app directly or indirectly,
 * except one.  This step currently runs during `./setup-{prod,dev}` but would
 * make sense as a postinstall as well.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
function consolidateBluebird ({ projectBaseDir }) {
  logInfo('Looking for bluebird duplicates ...')

  const matches = glob(
    '{packages,node_modules/@cypress,node_modules/@packages}/**/node_modules/bluebird',
    {
      cwd: projectBaseDir,
    },
  ).map((x) => path.join(projectBaseDir, x))

  logInfo(
    'Found %d bluebird duplicates%s',
    matches.length,
    matches.length > 0 ? ', removing them' : '',
  )

  try {
    for (const dir of matches) {
      fs.rmdirSync(dir, { recursive: true })
    }

    logInfo('Done removing bluebird duplicates')
  } catch (err) {
    logError(err)
    throw err
  }
}

function consolidateDeps ({ projectBaseDir }) {
  return consolidateBluebird({ projectBaseDir })
}

module.exports = { consolidateDeps }
