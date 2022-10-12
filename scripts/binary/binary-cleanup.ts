import fs from 'fs-extra'
import path from 'path'
import { consolidateDeps } from '@tooling/v8-snapshot/src/setup/consolidate-deps'
import del from 'del'
import * as meta from './meta'
import esbuild from 'esbuild'

const snapshotMetadata = require('../../tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json')

const external: string[] = [
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

const cleanup = async () => {
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
    external,
  })

  const potentiallyRemovedDependencies: string[] = [...snapshotMetadata.healthy, ...snapshotMetadata.deferred, ...snapshotMetadata.norewrite]
  const keptDependencies = Object.keys(esbuildResult.metafile.inputs)

  await Promise.all(potentiallyRemovedDependencies.map(async (dependency) => {
    if (dependency !== './package.json' && external.findIndex((externalDependency) => {
      return dependency.includes(externalDependency)
    }) === -1 && !keptDependencies.includes(dependency.slice(2))) {
      await fs.remove(meta.buildAppDir(dependency.replace(/.ts$/, '.js')))
    }
  }))

  await consolidateDeps({ projectBaseDir: meta.buildAppDir() })
  await del([
    meta.buildAppDir('node_modules', 'mocha'),
    meta.buildAppDir('**', 'test'),
    meta.buildAppDir('**', 'tests'),
    meta.buildAppDir('**', 'prettier', 'esm'),
    meta.buildAppDir('**', '@babel', '**', 'esm'),
    meta.buildAppDir('**', '*js.map'),
    meta.buildAppDir('**', '*.md'),
    meta.buildAppDir('**', '*.d.ts'),
    meta.buildAppDir('**', '*.flow'),
    meta.buildAppDir('**', 'jimp', 'browser', 'examples'),
    meta.buildAppDir('**', 'JSV', 'jsdoc-toolkit'),
    meta.buildAppDir('**', 'JSV', 'docs'),
    meta.buildAppDir('**', 'fluent-ffmpeg', 'doc'),
    meta.buildAppDir('**', 'registry-js', 'prebuilds'),
    meta.buildAppDir('**', 'ramda', 'es'),
    meta.buildAppDir('**', 'ramda', 'dist'),
    meta.buildAppDir('**', '*.cc'),
    meta.buildAppDir('**', '*.o'),
    meta.buildAppDir('**', 'jimp', 'browser'),
    meta.buildAppDir('**', 'jimp', 'es'),
    meta.buildAppDir('**', '@jimp', '**', 'es'),
    meta.buildAppDir('**', '@jimp', '**', 'src'),
    meta.buildAppDir('**', 'nexus', 'src'),
    meta.buildAppDir('**', 'nexus', 'dist-esm'),
    meta.buildAppDir('**', 'source-map', 'dist'),
    meta.buildAppDir('**', 'source-map-js', 'dist'),
    meta.buildAppDir('node_modules', '**', 'yarn.lock'),
    meta.buildAppDir('**', 'pako', 'dist'),
    meta.buildAppDir('**', 'ajv', 'lib', '*.ts'),
    meta.buildAppDir('node_modules', 'ajv', 'dist'),
    meta.buildAppDir('**', 'node-forge', 'dist'),
    meta.buildAppDir('**', '@graphql-tools', '**', '*.mjs'),
    meta.buildAppDir('**', 'graphql', '**', '*.mjs'),
  ], { force: true })

  await removeEmptyDirectories(meta.buildAppDir())
}

export {
  cleanup,
}
