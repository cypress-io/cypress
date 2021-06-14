'use strict'

// @ts-check

const { createConfig } = require('./config')
const env = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'prod' : 'dev'

// Config will be provided by `@packages/snapshot` in the future
const config = createConfig(env)
const { projectBaseDir } = config

const { DirtSimpleFileCache } = require('dirt-simple-file-cache')
const { packherdRequire } = require('packherd/dist/src/require.js')

const isDev = env === 'dev'

if (isDev) {
  packherdRequire(projectBaseDir, {
    transpileOpts: {
      supportTS: true,
      initTranspileCache: () => {
        return DirtSimpleFileCache.initSync(projectBaseDir, {
          cacheDir: '/tmp/cypress-cache/',
          keepInMemoryCache: true,
        })
      },
      tsconfig: {
        compilerOptions: {
          useDefineForClassFields: false, // default
          importsNotUsedAsValues: 'remove', // default
        },
      },
    },
  })
}
