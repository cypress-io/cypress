const electronLink = require('electron-link')
const path = require('path')
const fs = require('fs').promises
const vm = require('vm')
const childProcess = require('child_process')

const run = async () => {
  let processedFiles = 0
  const baseDirPath = process.env.PROJECT_BASE_DIR
  const snapshotScriptPath = path.join(__dirname, 'packages', 'server', 'server-snapshot.js')
  const coreModules = new Set([
    'electron',
    'async_hooks',
    'inspector',
    'worker_threads',
    'osx-temperature-sensor',
    'timers',
    './lib-cov/fluent-ffmpeg',
    'pnpapi',
    'file',
    'system',
    'console',
    'original-fs',
    'process',
    'graceful-fs',
    'safer-buffer',
  ])
  const { snapshotScript } = await electronLink({
    baseDirPath,
    mainPath: path.join(__dirname, 'packages', 'server', 'server.js'),
    cachePath: path.join(__dirname, '.electron-cache'),
    shouldExcludeModule: ({ requiringModulePath, requiredModulePath }) => {
      if (processedFiles > 0) {
        process.stdout.write('\r')
      }

      process.stdout.write(
        `Generating snapshot script at "${snapshotScriptPath}" (${++processedFiles})`,
      )

      const requiredModuleRelativePath = path.relative(
        baseDirPath,
        requiredModulePath,
      )

      return (
        requiredModulePath.endsWith('.node') ||
        coreModules.has(requiredModulePath) ||
        requiredModuleRelativePath.includes(
          path.join(
            'node_modules',
            'bluebird',
          ),
        ) ||
        requiredModuleRelativePath.includes(
          path.join(
            'node_modules',
            'electron',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'bundle-require',
            'dist',
            'index.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'lockfile',
            'lockfile.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'npm-conf',
            'lib',
            'defaults.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'evil-dns',
            'evil-dns.js',
          ),
        ) ||
        requiredModuleRelativePath.includes(
          path.join(
            'node_modules',
            'safer-buffer',
          ),
        ) || 
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'signal-exit',
            'index.js',
          ),
        ) ||
        requiredModuleRelativePath.includes(
          path.join(
            '@cypress',
            'webpack-dev-server',
          ),
        ) ||
        requiredModuleRelativePath.includes(
          path.join(
            'node_modules',
            'safefs',
          ),
        ) ||
        requiredModuleRelativePath.includes(
          path.join(
            'node_modules',
            'express',
            'lib',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'prettier',
            'index.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'ts-node',
            'dist',
            'index.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'coffeescript',
            'lib',
            'coffee-script',
            'register.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'coffee-script',
            'lib',
            'coffee-script',
            'register.js',
          ),
        ) ||
        requiredModuleRelativePath.includes(
          path.join('node_modules', 'graceful-fs'),
        )
      )
    },
  })

  await fs.writeFile(snapshotScriptPath, snapshotScript)

  try {
    vm.runInNewContext(snapshotScript, undefined, { filename: snapshotScriptPath, displayErrors: true })

    childProcess.spawnSync('node', ['node_modules/electron-mksnapshot/mksnapshot.js', '/Users/ryanm/v8-snapshots/tg-webpack/packages/server/server-snapshot.js'])

    const files = ['snapshot_blob.bin', 'v8_context_snapshot.x86_64.bin']

    for (const file of files) {
      await fs.rename(path.join(__dirname, file), path.join(__dirname, 'packages', 'electron', 'dist', 'Cypress', 'Cypress.app', 'Contents', 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Resources', file))
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }
}

run()
