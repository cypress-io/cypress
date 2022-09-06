const path = require('path')
const env = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'prod' : 'dev'

process.env.PROJECT_BASE_DIR = process.env.PROJECT_BASE_DIR ?? path.join(__dirname, '..', '..')

const isDev = env === 'dev'

function runWithSnapshot () {
  const { snapshotRequire } = require('@packages/v8-snapshot-require')
  const projectBaseDir = process.env.PROJECT_BASE_DIR

  snapshotRequire(projectBaseDir, {
    diagnostics: isDev,
    useCache: true,
    transpileOpts: {
      supportTS: isDev,
      initTranspileCache: isDev
        ? () => require('dirt-simple-file-cache').DirtSimpleFileCache.initSync(projectBaseDir, { cacheDir: path.join(projectBaseDir, 'node_modules', '.dsfc'), keepInMemoryCache: true })
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

if (process.env.DISABLE_SNAPSHOT_REQUIRE != null) {
  require('@packages/ts/register')
} else {
  runWithSnapshot()
}
