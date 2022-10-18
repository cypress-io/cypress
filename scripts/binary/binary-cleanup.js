const fs = require('fs-extra')
const path = require('path')
const { consolidateDeps } = require('@tooling/v8-snapshot')
const del = require('del')
const esbuild = require('esbuild')
const snapshotMetadata = require('@tooling/v8-snapshot/cache/prod-darwin/snapshot-meta.cache.json')

const getEsbuildConfig = () => {
  return {
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
      require.resolve('webpack'),
      require.resolve('webpack/hot/only-dev-server'),
      require.resolve('webpack/hot/dev-server'),
      require.resolve('webpack-dev-server', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('webpack-dev-server/client/index', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('webpack-dev-server/client/clients/SockJSClient', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('webpack-dev-server/client/clients/WebSocketClient', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('terser-webpack-plugin/dist/minify', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('watchpack', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('html-webpack-plugin-4', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('html-webpack-plugin-5', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('html-webpack-plugin-5/lib/loader', { paths: [path.join(__dirname, '..', '..', 'npm', 'webpack-dev-server')] }),
      require.resolve('buffer/'),
      require.resolve('coffee-loader'),
      './node_modules/worker-farm/lib/child/index.js',
      './node_modules/webpack/buildin/global.js',
      './node_modules/webpack/buildin/system.js',
      require.resolve('node-libs-browser/mock/empty'),
      './node_modules/ts-node/dist/transpilers/swc.js',
      './node_modules/terser-webpack-plugin/dist/worker.js',
      require.resolve('browserify-zlib'),
      require.resolve('vm-browserify'),
      require.resolve('url/'),
      require.resolve('tty-browserify'),
      require.resolve('timers-browserify'),
      require.resolve('string_decoder/'),
      require.resolve('readable-stream/writable.js'),
      require.resolve('readable-stream/transform.js'),
      require.resolve('readable-stream/readable.js'),
      require.resolve('readable-stream/passthrough.js'),
      require.resolve('readable-stream/duplex.js'),
      require.resolve('stream-browserify'),
      require.resolve('querystring-es3/'),
      require.resolve('process/browser.js'),
      require.resolve('util/util.js'),
      require.resolve('punycode/'),
      require.resolve('path-browserify'),
      require.resolve('os-browserify/browser.js'),
      require.resolve('https-browserify'),
      require.resolve('stream-http'),
      require.resolve('events/'),
      require.resolve('domain-browser'),
      require.resolve('crypto-browserify'),
      require.resolve('constants-browserify'),
      require.resolve('console-browserify'),
      require.resolve('assert/'),
      require.resolve('isexe'),
      require.resolve('babel-plugin-add-module-exports'),
      require.resolve('@babel/plugin-proposal-class-properties'),
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      require.resolve('lodash'),
      ...['ibmi',
        'sunos',
        'android',
        'darwin',
        'freebsd',
        'linux',
        'openbsd',
        'sunos',
        'win32'].map((platform) => require.resolve(`default-gateway/${platform}`)),
    ],
    bundle: true,
    outdir: 'out',
    platform: 'node',
    metafile: true,
    external: [
      './packages/server/server-entry',
      'fsevents',
      './npm/webpack-batteries-included-preprocessor/empty',
      'coffee-loader',
      '@babel/preset-react',
      '@babel/preset-env',
      '@babel/plugin-transform-runtime',
      '@babel/runtime/package',
      'babel-loader',
      'ts-loader',
      './child/index',
      '../../buildin/global',
      '../../buildin/system',
      'node-libs-browser/mock/empty',
      './transpilers/swc.js',
      './worker',
      'browserify-zlib',
      'vm-browserify',
      'url/',
      'tty-browserify',
      'timers-browserify',
      'string_decoder/',
      'readable-stream/writable.js',
      'readable-stream/transform.js',
      'readable-stream/readable.js',
      'readable-stream/passthrough.js',
      'readable-stream/duplex.js',
      'stream-browserify',
      'querystring-es3/',
      'process/browser.js',
      'util/util.js',
      'punycode/',
      'path-browserify',
      'os-browserify/browser.js',
      'https-browserify',
      'stream-http',
      'events/',
      'domain-browser',
      'crypto-browserify',
      'constants-browserify',
      'console-browserify',
      'buffer/',
      'esbuild',
      '../../bin/coffee',
      'assert/',
      'babel-plugin-add-module-exports',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      './lib/loader.js',
      'emitter',
      'pnpapi',
      '@swc/core',
      '../client/index.js',
      '../client/clients/SockJSClient',
      '../client/clients/WebSocketClient',
      'webpack/hot/only-dev-server',
      'webpack/hot/dev-server',
      'watchpack',
      './minify',
      './processChild',
    ],
  }
}

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
  const esbuildConfig = getEsbuildConfig()
  const esbuildResult = await esbuild.build(esbuildConfig)

  const potentiallyRemovedDependencies = [...snapshotMetadata.healthy, ...snapshotMetadata.deferred, ...snapshotMetadata.norewrite]
  const keptDependencies = Object.keys(esbuildResult.metafile.inputs)

  await Promise.all(potentiallyRemovedDependencies.map(async (dependency) => {
    if (dependency !== './package.json' && dependency !== './packages/server/server-entry.js' && !dependency.includes('marionette-client') && esbuildConfig.entryPoints.findIndex((externalDependency) => {
      return dependency === externalDependency
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
    path.join(buildAppDir, '**', 'ajv', 'lib', '**', '*.ts'),
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
