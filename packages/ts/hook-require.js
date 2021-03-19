'use strict'

// @ts-check

const { createConfig } = require('@packages/snapshot')
const env = process.env.CYPRESS_ENV === 'production' ? 'prod' : 'dev'
const config = createConfig(env)

const isDev = env === 'dev'

if (process.env.USE_SNAPSHOT != null) {
  runWithSnapshot()
} else {
  runWithoutSnapshot()
}

function runWithSnapshot () {
  const { snapshotRequire } = require('v8-snapshot/dist/loading/snapshot-require')
  const { projectBaseDir } = config

  snapshotRequire(projectBaseDir, {
    diagnostics: isDev,
    useCache: true,
    transpileOpts: {
      supportTS: isDev,
      initTranspileCache: isDev
        ? require('dirt-simple-file-cache').DirtSimpleFileCache.initSync
        : function () {},
      tsconfig: {
        compilerOptions: {
          useDefineForClassFields: false, // default
          importsNotUsedAsValues: 'remove', // default
        },
      },
    },

  })
}

function runWithoutSnapshot () {
  const { DirtSimpleFileCache } = require('dirt-simple-file-cache')
  const { packherdRequire } = require('packherd/dist/src/require.js')
  const { projectBaseDir } = config

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
}
