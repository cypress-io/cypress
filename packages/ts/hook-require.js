'use strict'

const path = require('path')
const { DirtSimpleFileCache } = require('dirt-simple-file-cache')
const { packherdRequire } = require('packherd/dist/src/require.js')

const projectBaseDir = path.dirname(require.resolve('../../package.json'))

packherdRequire(projectBaseDir, {
  transpileOpts: {
    supportTS: true,
    initTranspileCache: DirtSimpleFileCache.initSync,
    tsconfig: {
      compilerOptions: {
        useDefineForClassFields: false, // default
        importsNotUsedAsValues: 'remove', // default
      },
    },
  },
})
