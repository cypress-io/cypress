import path from 'path'
import { snapshotRequire } from '@packages/v8-snapshot-require'
const env = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'prod' : 'dev'

const projectBaseDir = process.env.PROJECT_BASE_DIR ?? path.join(__dirname, '..', '..')

process.env.PROJECT_BASE_DIR = projectBaseDir

const isDev = env === 'dev'

export const runWithSnapshot = (forceTypeScript: boolean) => {
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

export const hookRequire = ({ forceTypeScript }) => {
  // @ts-expect-error - getSnapshotResult is global
  if (['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE) || typeof getSnapshotResult === 'undefined') {
    require('tsx/cjs')
  } else {
    runWithSnapshot(forceTypeScript)
  }
}
