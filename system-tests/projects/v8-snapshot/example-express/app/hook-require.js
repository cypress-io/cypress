// @ts-check
'use strict'

const path = require('path')

require('@packages/v8-snapshot-require').snapshotRequire(path.resolve(__dirname, '..'), {
  diagnosticsEnabled: true,
  useCache: true,
})
