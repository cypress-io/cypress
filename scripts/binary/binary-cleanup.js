const fs = require('fs-extra')
const path = require('path')
const { consolidateDeps } = require('@tooling/v8-snapshot')
const del = require('del')
const esbuild = require('esbuild')
const snapshotMetadata = require('@tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json')

const externalDependencies = [
  './packages/server/server-entry',
  'fsevents',
  'esbuild',
  'assert',
  'buffer',
  'console-browserify',
  'constants-browserify',
  'crypto-browserify',
  'domain-browser',
  'events',
  'stream-http',
  'https-browserify',
  'os-browserify/browser.js',
  'path-browserify',
  'punycode',
  'process/browser.js',
  'querystring-es3',
  'stream-browserify',
  'readable-stream/duplex.js',
  'readable-stream/passthrough.js',
  'readable-stream/readable.js',
  'readable-stream/transform.js',
  'readable-stream/writable.js',
  'string_decoder',
  'util/util.js',
  'timers-browserify',
  'tty-browserify',
  'url',
  'vm-browserify',
  'browserify-zlib',
  'node-libs-browser/mock/empty',
  'ts-loader',
  'babel-loader',
  '@babel/plugin-transform-runtime',
  '@babel/runtime/package',
  '@babel/preset-env',
  '@babel/preset-react',
  'coffee-loader',
  '@cypress/webpack-batteries-included-preprocessor',
]

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

const cleanup = async (buildAppDir) => {
  const esbuildResult = await esbuild.build({
    entryPoints: [
      './packages/server/lib/plugins/child/register_ts_node.js',
      './packages/server/lib/plugins/child/require_async_child.js',
      './packages/server/index.js',
      './packages/server/hook-require.js',
      require.resolve('ts-loader'),
      require.resolve('babel-loader'),
      require.resolve('@babel/plugin-transform-runtime'),
      require.resolve('@babel/runtime/package'),
      require.resolve('@babel/preset-env'),
      require.resolve('@babel/preset-react'),
      require.resolve('coffee-loader'),
      require.resolve('typescript'),
      require.resolve('@cypress/webpack-batteries-included-preprocessor'),
    ],
    bundle: true,
    outdir: 'out',
    platform: 'node',
    metafile: true,
    external: externalDependencies,
  })

  const potentiallyRemovedDependencies = [...snapshotMetadata.healthy, ...snapshotMetadata.deferred, ...snapshotMetadata.norewrite]
  const keptDependencies = Object.keys(esbuildResult.metafile.inputs)

  await Promise.all(potentiallyRemovedDependencies.map(async (dependency) => {
    if (dependency !== './package.json' && externalDependencies.findIndex((externalDependency) => {
      return dependency.includes(externalDependency)
    }) === -1 && !keptDependencies.includes(dependency.slice(2))) {
      await fs.remove(path.join(buildAppDir, dependency.replace(/.ts$/, '.js')))
    }
  }))

  await consolidateDeps({ projectBaseDir: buildAppDir })
  await del([
    path.join(buildAppDir, '**', 'test'),
    path.join(buildAppDir, '**', 'tests'),
    path.join(buildAppDir, '**', 'prettier', 'esm'),
    path.join(buildAppDir, '**', '@babel', '**', 'esm'),
    path.join(buildAppDir, '**', '*js.map'),
    path.join(buildAppDir, '**', '*.md'),
    path.join(buildAppDir, '**', '*.d.ts'),
    path.join(buildAppDir, '**', '*.flow'),
    path.join(buildAppDir, '**', 'jimp', 'browser', 'examples'),
    path.join(buildAppDir, '**', 'JSV', 'jsdoc-toolkit'),
    path.join(buildAppDir, '**', 'JSV', 'docs'),
    path.join(buildAppDir, '**', 'fluent-ffmpeg', 'doc'),
    path.join(buildAppDir, '**', 'registry-js', 'prebuilds'),
    path.join(buildAppDir, '**', 'ramda', 'es'),
    path.join(buildAppDir, '**', 'ramda', 'dist'),
    path.join(buildAppDir, '**', '*.cc'),
    path.join(buildAppDir, '**', '*.o'),
    path.join(buildAppDir, '**', 'jimp', 'browser'),
    path.join(buildAppDir, '**', 'jimp', 'es'),
    path.join(buildAppDir, '**', '@jimp', '**', 'es'),
    path.join(buildAppDir, '**', '@jimp', '**', 'src'),
    path.join(buildAppDir, '**', 'nexus', 'src'),
    path.join(buildAppDir, '**', 'nexus', 'dist-esm'),
    path.join(buildAppDir, '**', 'source-map', 'dist'),
    path.join(buildAppDir, '**', 'source-map-js', 'dist'),
    path.join(buildAppDir, '**', 'yarn.lock'),
    path.join(buildAppDir, '**', 'pako', 'dist'),
    path.join(buildAppDir, '**', 'ajv', 'lib', '*.ts'),
    path.join(buildAppDir, '**', 'ajv', 'dist'),
    path.join(buildAppDir, '**', 'node-forge', 'dist'),
    path.join(buildAppDir, '**', '@graphql-tools', '**', '*.mjs'),
    path.join(buildAppDir, '**', 'graphql', '**', '*.mjs'),
  ], { force: true })

  await removeEmptyDirectories(buildAppDir)
}

module.exports = {
  cleanup,
}
