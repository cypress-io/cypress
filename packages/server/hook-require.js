const path = require('path')
const env = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'prod' : 'dev'

process.env.PROJECT_BASE_DIR = process.env.PROJECT_BASE_DIR ?? path.join(__dirname, '..', '..')

const isDev = env === 'dev'

function runWithSnapshot (forceTypeScript) {
  const { snapshotRequire } = require('@packages/v8-snapshot-require')
  const projectBaseDir = process.env.PROJECT_BASE_DIR

  const supportTS = forceTypeScript || typeof global.getSnapshotResult === 'undefined' || global.supportTypeScript

  snapshotRequire(projectBaseDir, {
    diagnosticsEnabled: isDev,
    useCache: true,
    transpileOpts: {
      supportTS,
      initTranspileCache: supportTS
        ? () => require('dirt-simple-file-cache').DirtSimpleFileCache.initSync(projectBaseDir, { cacheDir: path.join(projectBaseDir, 'node_modules', '.dsfc'), keepInMemoryCache: true })
        : undefined,
      tsconfig: {
        compilerOptions: {
          useDefineForClassFields: false, // default
          importsNotUsedAsValues: 'remove', // default
        },
      },
    },

  })
}

const hookRequire = ({ forceTypeScript }) => {
  if (['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE) || typeof getSnapshotResult === 'undefined') {
    require('@packages/ts/register')
  } else {
    runWithSnapshot(forceTypeScript)
  }
}

module.exports = {
  hookRequire,
}
