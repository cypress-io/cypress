const fs = require('../lib/fs')
const path = require('path')

/**
 * https://github.com/cypress-io/cypress/pull/5780
 * Folder names in "node_modules/@types" that were copied to cli/types to generate index.d.ts.
 * They cause type errors in type checker. So, they should be removed.
 */
const includeTypes = [
  'blob-util',
  'bluebird',
  'lodash',
  'mocha',
  'minimatch',
  'sinon',
  'sinon-chai',
  'chai',
  'chai-jquery',
  'jquery',
]

includeTypes.forEach((t) => {
  const dir = path.join(__dirname, '../types', t)

  if (fs.existsSync(dir)) {
    fs.removeSync(dir)
  }
})
