/* eslint-disable no-console */

const now = require('performance-now')
// const fs = require('fs')
const path = require('path')
// const inspector = require('inspector')
const { app, BrowserWindow } = require('electron')
const { ResultsManager } = require('../util/results')
// const v8Profiler = require('v8-profiler-next')

// const title = 'electron-snapshot-experiments'
const assetType = process.env.ASSET_TYPE || 'vanilla'
const profile = process.env.PROFILE != null
const compileCache = process.env.COMPILE_CACHE != null
const clearData = process.env.CLEAR_DATA != null
const dumpResults = process.env.DUMP_RESULTS != null
const useSnapshot = process.env.USE_SNAPSHOT != null
const results = new ResultsManager(
  process.env.RUN || '',
  assetType,
  profile,
  compileCache,
  useSnapshot,
)

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
  runWithoutSnapshot()
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

function runWithoutSnapshot () {
  const { DirtSimpleFileCache } = require('dirt-simple-file-cache')
  const { packherdRequire } = require('packherd/dist/src/require.js')
  const projectBaseDir = path.resolve(__dirname, '..', '..', '..')

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

function run () {
  let startLoad
  let endLoad

  return new Promise((resolve, reject) => {
    try {
      // if (profile) {
      //   v8Profiler.setGenerateType(1)

      //   v8Profiler.startProfiling(title, true)
      // }

      // require('time-require')

      // console.time('init')

      startLoad = now()
      const react = loadDep()

      endLoad = now()

      process.emit('exit')
      // console.timeEnd('init')

      console.log({ version: react.version })
      // if (profile) {
      //   const profile = v8Profiler.stopProfiling(title)

      //   profile.export((err, result) => {
      //     fs.writeFileSync(`${title}.cpuprofile`, result)
      //     profile.delete()
      //   })
      // }

      resolve()
    } catch (err) {
      console.error(err)
      reject(err)
    } finally {
      if (clearData) results.clear()

      results.append(endLoad - startLoad)
      results.save()
      if (dumpResults) results.dump()
    }
  })
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

  // if (profile) {
  //   console.log('waiting for debugger')
  //   inspector.waitForDebugger()
  // }

  await run()
  win.close()
}

app.whenReady().then(createWindow)
