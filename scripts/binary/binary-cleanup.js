const fs = require('fs-extra')
const path = require('path')
const { consolidateDeps } = require('@tooling/v8-snapshot')
const del = require('del')
const esbuild = require('esbuild')
const snapshotMetadata = require('@tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json')
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

const getDependencyPathsToKeep = async (buildAppDir) => {
  const unixBuildAppDir = buildAppDir.split(path.sep).join(path.posix.sep)
  const startingEntryPoints = [
    'packages/server/index.js',
    'packages/server/hook-require.js',
    'packages/server/lib/plugins/child/require_async_child.js',
    'packages/server/lib/plugins/child/register_ts_node.js',
    'packages/rewriter/lib/threads/worker.js',
    'node_modules/webpack/lib/webpack.js',
    'node_modules/webpack-dev-server/lib/Server.js',
    'node_modules/html-webpack-plugin-4/index.js',
    'node_modules/html-webpack-plugin-5/index.js',
    'node_modules/mocha-7.0.1/index.js',
  ]

  let entryPoints = new Set([
    ...startingEntryPoints.map((entryPoint) => path.join(unixBuildAppDir, entryPoint)),
    // These dependencies are completely dynamic using the pattern `require(`./${name}`)` and will not be pulled in by esbuild but still need to be kept in the binary.
    ...['ibmi',
      'sunos',
      'android',
      'darwin',
      'freebsd',
      'linux',
      'openbsd',
      'sunos',
      'win32'].map((platform) => path.join(unixBuildAppDir, `node_modules/default-gateway/${platform}.js`)),
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
        './server-entry',
        'fsevents',
        'pnpapi',
        '@swc/core',
        'emitter',
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

  return [...Object.keys(esbuildResult.metafile.inputs), ...entryPoints]
}

const cleanup = async (buildAppDir) => {
  // 1. Retrieve all dependencies that still need to be kept in the binary. In theory, we could use the bundles generated here as single files within the binary,
  // but for now, we just track on the dependencies that get pulled in
  const keptDependencies = [...await getDependencyPathsToKeep(buildAppDir), 'package.json', 'packages/server/server-entry.js']

  // 2. Gather the dependencies that could potentially be removed from the binary due to being in the snapshot
  const potentiallyRemovedDependencies = [...snapshotMetadata.healthy, ...snapshotMetadata.deferred, ...snapshotMetadata.norewrite]

  // 3. Remove all dependencies that are in the snapshot but not in the list of kept dependencies from the binary
  await Promise.all(potentiallyRemovedDependencies.map(async (dependency) => {
    const typeScriptlessDependency = dependency.replace(/\.ts$/, '.js')

    // marionette-client and babel/runtime require all of their dependencies in a very non-standard dynamic way. We will keep anything in marionette-client and babel/runtime
    if (!keptDependencies.includes(typeScriptlessDependency.slice(2)) && !typeScriptlessDependency.includes('marionette-client') && !typeScriptlessDependency.includes('@babel/runtime')) {
      await fs.remove(path.join(buildAppDir, typeScriptlessDependency))
    }
  }))

  // 4. Consolidate dependencies that are safe to consolidate (`lodash` and `bluebird`)
  await consolidateDeps({ projectBaseDir: buildAppDir })

  // 5. Remove various unnecessary files from the binary to further clean things up. Likely, there is additional work that can be done here
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
    path.join(buildAppDir, '**', '@jimp', '**', 'es'),
    path.join(buildAppDir, '**', 'nexus', 'dist-esm'),
    path.join(buildAppDir, '**', '@graphql-tools', '**', '*.mjs'),
    path.join(buildAppDir, '**', 'graphql', '**', '*.mjs'),
    // We currently do not use any map files
    path.join(buildAppDir, '**', '*js.map'),
    // License files need to be kept
    path.join(buildAppDir, '**', '!(LICENSE|license|License).md'),
    // These are type related files that are not used within the binary
    path.join(buildAppDir, '**', '*.d.ts'),
    path.join(buildAppDir, '**', 'ajv', 'lib', '**', '*.ts'),
    path.join(buildAppDir, '**', '*.flow'),
    // Example files are not needed
    path.join(buildAppDir, '**', 'jimp', 'browser', 'examples'),
    // Documentation files are not needed
    path.join(buildAppDir, '**', 'JSV', 'jsdoc-toolkit'),
    path.join(buildAppDir, '**', 'JSV', 'docs'),
    path.join(buildAppDir, '**', 'fluent-ffmpeg', 'doc'),
    // Files used as part of prebuilding are not necessary
    path.join(buildAppDir, '**', 'registry-js', 'prebuilds'),
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

  // 6. Remove any empty directories as a result of the rest of the cleanup
  await removeEmptyDirectories(buildAppDir)
}

module.exports = {
  cleanup,
}
