const fs = require('fs-extra')
const path = require('path')
const { consolidateDeps } = require('@tooling/v8-snapshot')
const del = require('del')
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

// Snapshot metadata follows the dev install's hoisting, so on a case-insensitive filesystem a stale
// path can hit a different file, e.g. mime 1's `mime/mime.js` resolving to mime 3's `mime/Mime.js`.
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
    // jimp is deferred in the snapshot, so its dependencies are loaded from disk
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

  // The general idea here is to run esbuild on entry points that are used outside of the snapshot. If, during the process,
  // we find places where we do a require.resolve on a module, that should be treated as an additional entry point and we run
  // esbuild again. We do this until we no longer find any new entry points. The resulting metafile inputs are
  // the dependency paths that we need to ensure stay in the snapshot.
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

// Optional dependencies such as fsevents or @swc/core are only installed on some platforms and are
// required inside try/catch, so leave whatever cannot be resolved as a runtime require.
// A relative runtime require (such as a native addon's `../build/Release/x.node`) runs from the bundle's
// directory, so it is rewritten relative to the bundle.
const externalizeUnresolvable = (bundleDir, unresolved) => {
  const external = (args) => {
    if (!args.path.startsWith('.')) {
      return { path: args.path, external: true }
    }

    const fromBundle = path.relative(bundleDir, path.resolve(args.resolveDir, args.path)).split(path.sep).join(path.posix.sep)

    return { path: fromBundle.startsWith('.') ? fromBundle : `./${fromBundle}`, external: true }
  }

  return {
    name: 'externalize-unresolvable',
    setup (build) {
      build.onResolve({ filter: /.*/ }, async (args) => {
        if (args.pluginData?.externalizeUnresolvable || args.kind === 'entry-point') {
          return undefined
        }

        if (args.path.endsWith('.node')) {
          return external(args)
        }

        const result = await build.resolve(args.path, {
          kind: args.kind,
          importer: args.importer,
          resolveDir: args.resolveDir,
          pluginData: { externalizeUnresolvable: true },
        })

        if (result.errors.length) {
          unresolved.add(`${args.path} (from ${args.importer})`)

          return external(args)
        }

        return result
      })
    },
  }
}

const REQUIRE_RESOLVE_LITERAL = /\brequire\.resolve\(\s*(['"`])([^'"`]+)\1/g

// Every module keeps its original __filename/__dirname and require.resolve base, so code that reads
// files next to itself or resolves packages still sees its location on disk rather than the bundle's.
const keepModuleLocation = (buildAppDir, requireResolveTargets) => {
  return {
    name: 'keep-module-location',
    setup (build) {
      build.onLoad({ filter: /\.(c?js)$/ }, async (args) => {
        let contents = await fs.readFile(args.path, 'utf8')
        const usesRequireResolve = contents.includes('require.resolve(')

        if (!usesRequireResolve && !/\b__(dirname|filename)\b/.test(contents)) {
          return { contents, loader: 'js' }
        }

        if (usesRequireResolve) {
          for (const [, , request] of contents.matchAll(REQUIRE_RESOLVE_LITERAL)) {
            try {
              requireResolveTargets.add(require.resolve(request, { paths: [path.dirname(args.path)] }))
            } catch {
              // an optional package that is not installed resolves at runtime the same way it would unbundled
            }
          }

          contents = contents.replace(/\brequire\.resolve\(/g, `require('module').createRequire(__filename).resolve(`)
        }

        const relativePath = path.relative(buildAppDir, args.path).split(path.sep).join(path.posix.sep)
        const header = `var __filename = require('path').join(__cypressAppDir, ${JSON.stringify(relativePath)}), __dirname = require('path').dirname(__filename);`

        // keep a shebang on the first line
        contents = contents.startsWith('#!') ? contents.replace(/^(#!.*\n)/, `$1${header}`) : `${header}${contents}`

        return { contents, loader: 'js' }
      })
    },
  }
}

// The binary loads this bundle instead of requiring the main process module graph file by file.
const createStartCypressBundle = async (buildAppDir) => {
  const unixBuildAppDir = buildAppDir.split(path.sep).join(path.posix.sep)
  const requireResolveTargets = new Set()
  const unresolved = new Set()

  const esbuildResult = await esbuild.build({
    entryPoints: [path.join(unixBuildAppDir, 'packages/server/start-cypress.js')],
    outfile: path.join(unixBuildAppDir, 'packages/server/start-cypress.bundle.js'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    metafile: true,
    absWorkingDir: unixBuildAppDir,
    minify: true,
    // error stacks and code that reads `constructor.name` need the original names
    keepNames: true,
    external: ['electron'],
    banner: { js: `const __cypressAppDir = require('path').join(__dirname, '..', '..');` },
    plugins: [externalizeUnresolvable(path.join(buildAppDir, 'packages/server'), unresolved), keepModuleLocation(unixBuildAppDir, requireResolveTargets)],
  })

  console.log(`start-cypress bundle: ${Object.keys(esbuildResult.metafile.inputs).length} modules; left as runtime requires: ${[...unresolved].join(', ') || 'none'}`)

  return {
    bundledDependencies: Object.keys(esbuildResult.metafile.inputs).map((input) => `./${input}`),
    requireResolveTargets: [...requireResolveTargets].map((target) => path.relative(buildAppDir, target).split(path.sep).join(path.posix.sep)),
  }
}

const createServerEntryPointBundle = async (buildAppDir) => {
  const unixBuildAppDir = buildAppDir.split(path.sep).join(path.posix.sep)
  const entryPoints = [path.join(unixBuildAppDir, 'packages/server/index.js')]
  // Build the binary entry point ignoring anything that happens in start-cypress since that is bundled separately
  const esbuildResult = await esbuild.build({
    entryPoints,
    bundle: true,
    outdir: workingDir,
    platform: 'node',
    metafile: true,
    absWorkingDir: unixBuildAppDir,
    external: [
      './transpile-ts',
      './start-cypress',
      'electron',
    ],
  })

  console.log(`copying server entry point bundle from ${path.join(workingDir, 'index.js')} to ${path.join(buildAppDir, 'packages', 'server', 'index.js')}`)

  await fs.copy(path.join(workingDir, 'index.js'), path.join(buildAppDir, 'packages', 'server', 'index.js'))

  // Convert these inputs to a relative file path. Note that these paths are posix paths.
  return [...Object.keys(esbuildResult.metafile.inputs)].filter((input) => input !== 'packages/server/index.js').map((input) => `./${input}`)
}

const buildEntryPointAndCleanup = async (appDir) => {
  // esbuild reports real paths, so a symlink in the build path (macOS's /var) would put every module outside the app
  const buildAppDir = await fs.realpath(appDir)

  // 1. Bundle the main process module graph. Files that are only reached through it can then be removed from the binary,
  // except those that something resolves on disk with require.resolve.
  const { bundledDependencies, requireResolveTargets } = await createStartCypressBundle(buildAppDir)

  const [keptDependencies, serverEntryPointBundleDependencies] = await Promise.all([
    // 2. Retrieve all dependencies that are loaded from disk and so must be kept in the binary
    getDependencyPathsToKeep(buildAppDir, requireResolveTargets.filter((target) => /\.(c?js|json)$/.test(target))),
    // 3. Create a bundle for the server entry point. This will be used to start the server in the binary. It returns the dependencies that are pulled in by this bundle that potentially can now be removed
    createServerEntryPointBundle(buildAppDir),
  ])

  keptDependencies.push(...requireResolveTargets)

  // package.json and other data files stay: Node reads them to resolve the packages that are still loaded from disk
  const potentiallyRemovedDependencies = [
    ...bundledDependencies,
    ...serverEntryPointBundleDependencies,
  ].filter((dependency) => /\.c?js$/.test(dependency))

  console.log(`potentially removing ${potentiallyRemovedDependencies.length} dependencies`)

  // 4. Remove the bundled dependencies that are not in the list of kept dependencies from the binary
  const existsWithExactCase = createExactCaseChecker(buildAppDir)

  await Promise.all(potentiallyRemovedDependencies.map(async (dependency) => {
    // babel/runtime requires all of its dependencies in a very non-standard dynamic way. We will keep anything in babel/runtime
    if (!keptDependencies.includes(dependency.slice(2)) && !dependency.includes('@babel/runtime') && await existsWithExactCase(dependency)) {
      await fs.remove(path.join(buildAppDir, dependency))
    }
  }))

  // 5. Consolidate dependencies that are safe to consolidate (`lodash` and `bluebird`)
  await consolidateDeps({ projectBaseDir: buildAppDir })
}

const cleanupUnneededDependencies = async (buildAppDir) => {
  console.log(`removing unnecessary files from the binary to further lean out the distribution.`)
  // 6. Remove various unnecessary files from the binary to further clean things up. Likely, there is additional work that can be done here
  // this is it's own function as we always want to clean out unneeded dependencies
  await del([
    // Remove test files
    path.join(buildAppDir, '**', 'test'),
    path.join(buildAppDir, '**', 'tests'),
    // What we need of prettier is entirely encapsulated within the v8 snapshot, but has a few leftover large files
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
  createExactCaseChecker,
  createStartCypressBundle,
  buildEntryPointAndCleanup,
  cleanupUnneededDependencies,
}
