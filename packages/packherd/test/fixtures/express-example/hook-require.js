const { packherdRequire } = require('../../../')
const bundleExports = require('./bundle')

function hookRequire(diagnostics) {
  const entryFile = require.resolve('./app')
  packherdRequire(bundleExports, entryFile, {
    diagnostics,
    exportsObjects: false,
  })
}

hookRequire(true)
