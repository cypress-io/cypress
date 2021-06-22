// @ts-check
'use strict'

const { transform } = require('esbuild')
const path = require('path')
const plainFs = require('fs')
const fs = plainFs.promises
const debug = require('debug')

const { promisify } = require('util')
const glob = promisify(require('glob'))
const root = path.join(__dirname, '..')

const logInfo = debug('cy-ts:info')
const logDebug = debug('cy-ts:debug')

const DEFAULT_ESBUILD_OPTS = {
  target: ['node14.5'],
  loader: 'ts',
  format: 'cjs',
  sourcemap: 'external',
  minify: false,
}

const DEFAULT_TSCONFIG = {
  compilerOptions: {
    useDefineForClassFields: false, // default
    importsNotUsedAsValues: 'remove', // default
  },
}

function jsFilepathFor (tsFilepath) {
  const ext = path.extname(tsFilepath)

  return `${tsFilepath.slice(0, -ext.length)}.js`
}

function artifactsFor (tsFilePath) /* :  [ string, string ] */ {
  const jsPath = jsFilepathFor(tsFilePath)
  const mapPath = `${jsPath}.map`

  return [jsPath, mapPath]
}

function canAccessSync (p) {
  try {
    plainFs.accessSync(p)

    return true
  } catch (_) {
    return false
  }
}

/**
 * Transpiles a given TypeScript file and writes the JavaScript artifact and related `.map` file to the file system
 * right next to the file it is transpiling.
 */
async function transpileFile (fullPath, tsconfig = DEFAULT_TSCONFIG) {
  const opts = Object.assign({}, DEFAULT_ESBUILD_OPTS, {
    tsconfigRaw: tsconfig,
    sourcefile: fullPath,
  })

  if (logDebug.enabled) {
    logDebug('Transform: "%s"', path.relative(root, fullPath))
  }

  const ts = await fs.readFile(fullPath, 'utf8')
  // @ts-ignore opts are compatible even though not strongly typed
  const { code, map } = await transform(ts, opts)
  const [jsPath, mapPath] = artifactsFor(fullPath)

  if (logDebug.enabled) {
    logDebug('Writing JavaScript: "%s"', path.relative(root, jsPath))
  }

  return fs.writeFile(jsPath, code, 'utf8').then(() => {
    if (logDebug.enabled) {
      logDebug('Writing Map File  : "%s"', path.relative(root, mapPath))
    }

    return fs.writeFile(mapPath, map, 'utf8')
  })
}

/**
 * Transpiles all given files to JavaScript placing it and the related `.map` file next to the TypeScript file.
 */
async function transpileFiles (fullPaths, tsconfig = DEFAULT_TSCONFIG) {
  const tasks = fullPaths.map((x) => transpileFile(x, tsconfig))

  return Promise.all(tasks)
}

const IGNORE_DIRS = [
  '__snapshots__',
  'app',
  'ca',
  'cypress',
  'dist',
  'node_modules',
  'scripts',
  'static',
  'test',
  'theme',
].join('|')

/**
 * Discovers all TypeScript files inside the project root recursively and transpiles them.
 * The resulting JavaScript and `.map` files are placed right next to their corresponding TypeScript files.
 */
async function transpileProject (projectRoot, tsconfig = DEFAULT_TSCONFIG) {
  logInfo(
    'Transpiling files for package: "%s"',
    path.relative(root, projectRoot),
  )

  const tsFiles = (
    await glob(`!(${IGNORE_DIRS}){,/**/}*.ts`, {
      cwd: projectRoot,
    })
  )
  .filter((x) => !x.endsWith('.d.ts'))
  .map((x) => path.join(projectRoot, x))

  return transpileFiles(tsFiles, tsconfig)
}

async function cleanProject (projectRoot) {
  logInfo(
    'Cleaning transpiled files for package: "%s"',
    path.relative(root, projectRoot),
  )

  const artifacts = (
    await glob(`!(${IGNORE_DIRS}){,/**/}*.ts`, {
      cwd: projectRoot,
    })
  )
  .filter((x) => !x.endsWith('.d.ts'))
  .map((x) => path.join(projectRoot, x))
  .map(artifactsFor)

  const artifactsToRemove = []

  for (const [jsPath, mapPath] of artifacts) {
    if (canAccessSync(jsPath)) artifactsToRemove.push(jsPath)

    if (canAccessSync(mapPath)) artifactsToRemove.push(mapPath)
  }

  const tasks = artifactsToRemove.map((file) => {
    logDebug('Removing "%s"', file)

    return fs.unlink(file)
  })

  return Promise.all(tasks)
}

module.exports = {
  transpileProject,
  transpileFiles,
  transpileFile,
  cleanProject,
}
