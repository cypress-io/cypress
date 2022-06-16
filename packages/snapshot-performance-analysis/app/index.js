/* eslint-disable no-console */

const now = require('performance-now')
const fs = require('fs')
const path = require('path')
const { app, BrowserWindow } = require('electron')
const { ResultsManager } = require('../util/results')

const Inspector = require('inspector-api')
const inspector = new Inspector()

const assetType = process.env.ASSET_TYPE || 'vanilla'
const profile = process.env.PROFILE != null
const compileCache = process.env.COMPILE_CACHE != null
const clearData = process.env.CLEAR_DATA != null
const dumpResults = process.env.DUMP_RESULTS != null
const useSnapshot = process.env.USE_SNAPSHOT != null
const slowExecution = process.env.SLOW_EXECUTION != null
const healthy = process.env.HEALTHY != null
const deferred = process.env.DEFERRED != null
const snapshotDev = process.env.SNAPSHOT_DEV != null

const results = new ResultsManager({
  run: process.env.RUN || '',
  assetType,
  profile,
  compileCache,
  useSnapshot,
  slowExecution,
  healthy,
  deferred,
  snapshotDev,
})

if (compileCache && useSnapshot) {
  throw new Error(
    'Can only use compileCache or v8 snapshot, but not at the same time',
  )
}

console.log({
  assetType,
  profile,
  compileCache,
  useSnapshot,
  clearData,
  dumpResults,
  results,
})

// const cached = compileCache ? 'cached:' : ''
// const snapshotted = useSnapshot ? 'snapshot' : ''
// const LOAD_DEP = `load:dep:${cached}${snapshotted}${assetType}`

if (compileCache) {
  console.log('using v8 compile cache')
  require('v8-compile-cache')
}

if (useSnapshot) {
  runWithSnapshot()
} else {
  // runWithoutSnapshot()
}

function runWithSnapshot () {
  const { snapshotRequire } = require('v8-snapshot/dist/loading/snapshot-require')
  const projectBaseDir = path.resolve(__dirname, '..', '..', '..')

  snapshotRequire(projectBaseDir, {
    diagnostics: true,
    useCache: true,
    transpileOpts: {
      supportTS: true,
      initTranspileCache: () => require('dirt-simple-file-cache').DirtSimpleFileCache.initSync(projectBaseDir, { keepInMemoryCache: true }),
      tsconfig: {
        compilerOptions: {
          useDefineForClassFields: false, // default
          importsNotUsedAsValues: 'remove', // default
        },
      },
    },

  })
}

// function runWithoutSnapshot () {
//   const { DirtSimpleFileCache } = require('dirt-simple-file-cache')
//   const { packherdRequire } = require('packherd/dist/src/require.js')
//   const projectBaseDir = path.resolve(__dirname, '..', '..', '..')

//   packherdRequire(projectBaseDir, {
//     transpileOpts: {
//       supportTS: true,
//       initTranspileCache: DirtSimpleFileCache.initSync,
//       tsconfig: {
//         compilerOptions: {
//           useDefineForClassFields: false, // default
//           importsNotUsedAsValues: 'remove', // default
//         },
//       },
//     },
//   })
// }

function loadDep () {
  let reactPath

  if (useSnapshot) {
    // Bundling and optional minification is performed when generating the snapshot
    reactPath = path.join('..', 'deps', 'index.js')
  } else {
    switch (assetType) {
      case 'vanilla':
        reactPath = path.join('..', 'deps', 'index.js')
        break
      case 'bundle':
        reactPath = path.join('..', 'build', 'react-bundle.js')
        break
      case 'bundle_minify':
        reactPath = path.join('..', 'build', 'react-bundle.min.js')
        break
      default:
        throw new Error(`Unknown asset type ${assetType}`)
    }
  }

  return require(reactPath)
}

async function run () {
  let startLoad
  let endLoad

  try {
    if (profile) {
      await inspector.profiler.enable()
      await inspector.profiler.start()
    } else {
      startLoad = now()
    }

    loadDep()

    if (profile) {
      const inspectorProf = await inspector.profiler.stop()

      let profileFileName = 'inspector-profile'

      if (profile) profileFileName += '_profiling'

      if (compileCache) profileFileName += '_cached'

      if (slowExecution) profileFileName += '_slow-execution'

      if (healthy) profileFileName += '_healthy'

      if (deferred) profileFileName += '_deferred'

      if (useSnapshot) {
        if (snapshotDev) {
          profileFileName += '_snapshot-dev'
        } else {
          profileFileName += '_snapshot-prod'
        }
      }

      fs.writeFileSync(`results/${profileFileName}.cpuprofile`, JSON.stringify(inspectorProf))
    } else {
      endLoad = now()
      if (clearData) results.clear()

      results.append(endLoad - startLoad)
      results.save()
      if (dumpResults) results.dump()
    }
  } catch (err) {
    console.error(err)
  }
}

async function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  win.loadFile('index.html')
  win.toggleDevTools()

  await run()
  win.close()
}

app.whenReady().then(createWindow)
