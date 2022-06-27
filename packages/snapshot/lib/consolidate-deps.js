'use strict'

// @ts-check

const path = require('path')
const fs = require('fs')
const { sync: glob } = require('glob')

const debug = require('debug')
const logInfo = debug('snapgen:info')
const logError = debug('snapgen:error')

function consolidateDep ({ projectBaseDir, dep }) {
  logInfo('Looking for %s duplicates ...', dep)

  const matches = glob(
    `{packages,node_modules/@cypress,node_modules/@packages}/**/node_modules/${dep}`,
    {
      cwd: projectBaseDir,
    },
  ).map((x) => path.join(projectBaseDir, x))

  logInfo(
    'Found %d %s duplicates%s',
    matches.length,
    dep,
    matches.length > 0 ? ', removing them' : '',
  )

  try {
    for (const dir of matches) {
      fs.rmdirSync(dir, { recursive: true })
    }

    logInfo('Done removing %s duplicates', dep)
  } catch (err) {
    logError(err)
    throw err
  }
}

/**
 * Remove all bluebird + lodash installations used by the app directly or indirectly,
 * except one.  This step currently runs during `./setup-{prod,dev}` but would
 * make sense as a postinstall as well.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
function consolidateDeps ({ projectBaseDir }) {
  consolidateDep({ projectBaseDir, dep: 'bluebird' })
  consolidateDep({ projectBaseDir, dep: 'lodash' })
}

module.exports = { consolidateDeps }
