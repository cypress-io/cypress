const fs = require('fs-extra')
const path = require('path')
const del = require('del')
const glob = require('glob')
const esbuild = require('esbuild')
const tempDir = require('temp-dir')
const workingDir = path.join(tempDir, 'binary-cleanup-workdir')

fs.ensureDirSync(workingDir)

async function removeEmptyDirectories (directory) {
  // lstat does not follow symlinks (in contrast to stat)
  const fileStats = await fs.lstat(directory)

  if (!fileStats.isDirectory()) {
    return
  }

  let fileNames = await fs.readdir(directory)

  if (fileNames.length > 0) {
    const recursiveRemovalPromises = fileNames.map(
      (fileName) => removeEmptyDirectories(path.join(directory, fileName)),
    )

    await Promise.all(recursiveRemovalPromises)

    // re-evaluate fileNames; after deleting subdirectory
    // we may have parent directory empty now
    fileNames = await fs.readdir(directory)
  }

  if (fileNames.length === 0) {
    await fs.rmdir(directory)
  }
}

// bluebird and lodash are nested under many packages at the same major version, so every package uses the top-level copy
const consolidateDuplicateDependencies = async (buildAppDir) => {
  for (const dependency of ['bluebird', 'lodash']) {
    const duplicates = glob.sync(`{packages,node_modules/@cypress,node_modules/@packages}/**/node_modules/${dependency}`, { cwd: buildAppDir })

    console.log(`removing ${duplicates.length} nested copies of ${dependency}`)

    await Promise.all(duplicates.map((duplicate) => fs.remove(path.join(buildAppDir, duplicate))))
  }
}

// On a case-insensitive filesystem, a path whose case differs from the file on disk deletes that other file,
// e.g. mime 1's `mime/mime.js` matching mime 3's `mime/Mime.js`.
const createExactCaseChecker = (baseDir) => {
  const dirEntries = new Map()

  const readDir = (dir) => {
    if (!dirEntries.has(dir)) {
      dirEntries.set(dir, fs.readdir(dir).catch(() => []))
    }

    return dirEntries.get(dir)
  }

  return async (relativePath) => {
    let dir = baseDir

    for (const segment of relativePath.split(/[\\/]/).filter((s) => s && s !== '.')) {
      if (!(await readDir(dir)).includes(segment)) {
        return false
      }

      dir = path.join(dir, segment)
    }

    return true
  }
}

const getDependencyPathsToKeep = async (buildAppDir, additionalEntryPoints = []) => {
  const unixBuildAppDir = buildAppDir.split(path.sep).join(path.posix.sep)
  const startingEntryPoints = [
    ...additionalEntryPoints,
    'packages/server/lib/plugins/child/require_async_child.js',
    'packages/server/node_modules/@cypress/webpack-batteries-included-preprocessor/dist/index.js',
    'packages/server/node_modules/ts-loader/index.js',
    'npm/webpack-batteries-included-preprocessor/dist/index.js',
    // needed in the server entry point
    'node_modules/tsx/dist/cjs/index.cjs',
    'node_modules/tsx/dist/loader.mjs',
    'node_modules/tslib/tslib.js',
    // esbuild is also a runtime dependency with tsx
    'node_modules/esbuild/lib/main.js',
    'node_modules/find-up/index.js',
    'node_modules/webpack/lib/webpack.js',
    'node_modules/webpack-dev-server/lib/Server.js',
    'node_modules/html-webpack-plugin-5/index.js',
    'node_modules/mocha-7.2.0/index.js',
    'packages/server/node_modules/webdriver/build/index.js',
    'packages/server/node_modules/@wdio/utils/build/node.js',
    // jimp is required at runtime rather than bundled, so its dependencies are loaded from disk
    'node_modules/jimp/dist/commonjs/index.js',
    // dependencies needed for geckodriver when running firefox in the binary
    'node_modules/pump/index.js',
    'node_modules/sprintf-js/src/sprintf.js',
    'node_modules/esutils/lib/utils.js',
    'node_modules/through/index.js',
    'node_modules/string-width/index.js',
    'node_modules/proxy-from-env/index.js',
    // end needed deps for geckodriver
    // better-sqlite3 is needed to be loaded in dynamically in studio
    'node_modules/better-sqlite3/lib/index.js',
  ]

  const entryPoints = new Set([
    ...startingEntryPoints.map((entryPoint) => path.join(unixBuildAppDir, entryPoint)),
  ])
  let esbuildResult
  let newEntryPointsFound = true

  // The general idea here is to run esbuild on entry points that are used outside of the start bundle. If, during the process,
  // we find places where we do a require.resolve on a module, that should be treated as an additional entry point and we run
  // esbuild again. We do this until we no longer find any new entry points. The resulting metafile inputs are
  // the dependency paths that we need to ensure stay in the binary.
  while (newEntryPointsFound) {
    esbuildResult = await esbuild.build({
      entryPoints: [...entryPoints],
      bundle: true,
      outdir: workingDir,
      platform: 'node',
      metafile: true,
      absWorkingDir: unixBuildAppDir,
      external: [
        './transpile-ts',
        './start-cypress',
        // TypeScript lowers `import('electron')` to `require('electron')`; esbuild must not
        // try to bundle it (electron is not installed under the packed app tree).
        'electron',
        'fsevents',
        'pnpapi',
        '@swc/core',
        'emitter',
        'ts-loader',
        'uglify-js',
        'esbuild',
        'enhanced-resolve/lib/createInnerCallback',
        // the server redirects reporters' `require('mocha')` to mocha-7.2.0, which is kept above
        'mocha',
      ],
    })

    newEntryPointsFound = false
    esbuildResult.warnings.forEach((warning) => {
      const matches = warning.text.match(/"(.*)" should be marked as external for use with "require.resolve"/)
      const warningSubject = matches && matches[1]

      if (warningSubject) {
        let entryPoint

        if (warningSubject.startsWith('.')) {
          entryPoint = path.join(unixBuildAppDir, path.dirname(warning.location.file), warningSubject)
        } else {
          entryPoint = require.resolve(warningSubject, { paths: [path.join(unixBuildAppDir, path.dirname(warning.location.file))] })
        }

        if (path.extname(entryPoint) !== '' && !entryPoints.has(entryPoint)) {
          newEntryPointsFound = true
          entryPoints.add(entryPoint)
        }
      }
    })
  }

  return [...Object.keys(esbuildResult.metafile.inputs), ...entryPoints, 'package.json']
}

// bundledDependencies are the files built into the start and server entry point bundles, and loadedFromDisk the
// files the start bundle still requires at runtime, all relative to buildAppDir, which must be a real path
const removeBundledDependencies = async (buildAppDir, { bundledDependencies, loadedFromDisk }) => {
  // 1. Retrieve all dependencies that are loaded from disk and so must be kept in the binary
  const keptDependencies = new Set([
    ...await getDependencyPathsToKeep(buildAppDir, loadedFromDisk.filter((target) => /\.(?:c?js|json)$/.test(target))),
    ...loadedFromDisk,
  ])

  // package.json and other data files stay: Node reads them to resolve the packages that are still loaded from disk
  const potentiallyRemovedDependencies = bundledDependencies.filter((dependency) => /\.c?js$/.test(dependency))

  console.log(`potentially removing ${potentiallyRemovedDependencies.length} dependencies`)

  // 2. Remove the bundled dependencies that are not in the list of kept dependencies from the binary
  const existsWithExactCase = createExactCaseChecker(buildAppDir)

  await Promise.all(potentiallyRemovedDependencies.map(async (dependency) => {
    // babel/runtime requires all of its dependencies in a very non-standard dynamic way. We will keep anything in babel/runtime
    if (!keptDependencies.has(dependency.slice(2)) && !dependency.includes('@babel/runtime') && await existsWithExactCase(dependency)) {
      await fs.remove(path.join(buildAppDir, dependency))
    }
  }))
}

const cleanupUnneededDependencies = async (buildAppDir) => {
  console.log(`removing unnecessary files from the binary to further lean out the distribution.`)
  // 3. Remove various unnecessary files from the binary to further clean things up. Likely, there is additional work that can be done here
  // this is it's own function as we always want to clean out unneeded dependencies
  await del([
    // Remove test files
    path.join(buildAppDir, '**', 'test'),
    path.join(buildAppDir, '**', 'tests'),
    // What we need of prettier is entirely encapsulated within the start bundle, but has a few leftover large files
    path.join(buildAppDir, '**', 'prettier', 'esm'),
    path.join(buildAppDir, '**', 'prettier', 'standalone.js'),
    path.join(buildAppDir, '**', 'prettier', 'bin-prettier.js'),
    // ESM files are mostly not needed currently
    path.join(buildAppDir, '**', '@babel', '**', 'esm'),
    path.join(buildAppDir, '**', 'ramda', 'es'),
    path.join(buildAppDir, '**', 'jimp', 'es'),
    path.join(buildAppDir, '**', 'nexus', 'dist-esm'),
    path.join(buildAppDir, '**', '@graphql-tools', '**', '*.mjs'),
    path.join(buildAppDir, '**', 'graphql', '**', '*.mjs'),
    path.join(buildAppDir, '**', '@openTelemetry', '**', 'esm'),
    path.join(buildAppDir, '**', '@openTelemetry', '**', 'esnext'),
    // We currently do not use any map files
    path.join(buildAppDir, '**', '*js.map'),
    // License files need to be kept
    path.join(buildAppDir, '**', '!(LICENSE|license|License).md'),
    // These are type related files that are not used within the binary
    path.join(buildAppDir, '**', '*.d.ts'),
    path.join(buildAppDir, '**', 'ajv', 'lib', '**', '*.ts'),
    path.join(buildAppDir, '**', '*.flow'),
    // Documentation files are not needed
    path.join(buildAppDir, '**', 'JSV', 'jsdoc-toolkit'),
    path.join(buildAppDir, '**', 'JSV', 'docs'),
    path.join(buildAppDir, '**', 'fluent-ffmpeg', 'doc'),
    // Files used as part of prebuilding are not necessary
    path.join(buildAppDir, '**', 'node_gyp_bins'),
    path.join(buildAppDir, '**', 'better-sqlite3', 'bin'),
    // better-sqlite3 loads these ahead of build/Release; the Linux ones need a newer glibc than Cypress supports
    path.join(buildAppDir, '**', 'better-sqlite3', 'prebuilds'),
    path.join(buildAppDir, '**', 'registry-js', 'prebuilds'),
    // x86_64-only, and only mocha's watch CLI reaches it, which Cypress never runs
    path.join(buildAppDir, '**', 'mocha-7.2.0', 'node_modules', 'fsevents'),
    path.join(buildAppDir, '**', '*.cc'),
    path.join(buildAppDir, '**', '*.o'),
    path.join(buildAppDir, '**', '*.c'),
    path.join(buildAppDir, '**', '*.h'),
    // Remove distributions that are not needed in the binary
    path.join(buildAppDir, '**', 'ramda', 'dist'),
    path.join(buildAppDir, '**', 'jimp', 'browser'),
    path.join(buildAppDir, '**', '@jimp', '**', 'src'),
    path.join(buildAppDir, '**', 'nexus', 'src'),
    path.join(buildAppDir, '**', 'source-map', 'dist'),
    path.join(buildAppDir, '**', 'source-map-js', 'dist'),
    path.join(buildAppDir, '**', 'pako', 'dist'),
    path.join(buildAppDir, '**', 'node-forge', 'dist'),
    path.join(buildAppDir, '**', 'pngjs', 'browser.js'),
    path.join(buildAppDir, '**', 'plist', 'dist'),
    // Remove yarn locks
    path.join(buildAppDir, '**', 'yarn.lock'),
  ], { force: true })

  // 7. Remove any empty directories as a result of the rest of the cleanup
  await removeEmptyDirectories(buildAppDir)
}

module.exports = {
  consolidateDuplicateDependencies,
  createExactCaseChecker,
  removeBundledDependencies,
  cleanupUnneededDependencies,
}
