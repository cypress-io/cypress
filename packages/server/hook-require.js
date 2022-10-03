const path = require('path')
const typescriptTranspilationRequired = !global.snapshotAuxiliaryData || global.snapshotAuxiliaryData.typescriptTranspilationRequired

process.env.PROJECT_BASE_DIR = process.env.PROJECT_BASE_DIR ?? path.join(__dirname, '..', '..')

function runWithSnapshot () {
  const { snapshotRequire } = require('@packages/v8-snapshot-require')
  const projectBaseDir = process.env.PROJECT_BASE_DIR

  snapshotRequire(projectBaseDir, {
    diagnostics: typescriptTranspilationRequired,
    useCache: true,
    transpileOpts: {
      supportTS: typescriptTranspilationRequired,
      initTranspileCache: typescriptTranspilationRequired
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

if (process.env.DISABLE_SNAPSHOT_REQUIRE != null || typeof snapshotResult === 'undefined') {
  require('@packages/ts/register')
} else {
  runWithSnapshot()
}
