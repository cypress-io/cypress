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
    'atom',
    'shell',
    'WNdb',
    'lapack',
    'remote',
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

      const requiringModuleRelativePath = path.relative(
        baseDirPath,
        requiringModulePath,
      )
      const requiredModuleRelativePath = path.relative(
        baseDirPath,
        requiredModulePath,
      )

      return (
        requiredModulePath.endsWith('.node') ||
        coreModules.has(requiredModulePath) ||
        requiringModuleRelativePath.endsWith(
          path.join('node_modules/xregexp/xregexp-all.js'),
        ) ||
        (requiredModuleRelativePath.startsWith(path.join('..', 'src')) &&
          requiredModuleRelativePath.endsWith('-element.js')) ||
        requiredModuleRelativePath.startsWith(
          path.join('..', 'node_modules', 'dugite'),
        ) ||
        requiredModuleRelativePath.startsWith(
          path.join(
            '..',
            'node_modules',
            'markdown-preview',
            'node_modules',
            'yaml-front-matter',
          ),
        ) ||
        requiredModuleRelativePath.startsWith(
          path.join(
            '..',
            'node_modules',
            'markdown-preview',
            'node_modules',
            'cheerio',
          ),
        ) ||
        requiredModuleRelativePath.startsWith(
          path.join(
            '..',
            'node_modules',
            'markdown-preview',
            'node_modules',
            'marked',
          ),
        ) ||
        requiredModuleRelativePath.startsWith(
          path.join('..', 'node_modules', 'typescript-simple'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'jsesc',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            '@ffmpeg-installer',
            'ffmpeg',
            'index.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'bluebird',
            'js',
            'release',
            'util.js',
          ),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'electron',
            'index.js',
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
        requiredModuleRelativePath.endsWith(
          path.join(
            'node_modules',
            'esbuild',
            'lib',
            'main.js',
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
            'konfig',
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
            'fluent-ffmpeg',
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
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'fs-extra', 'lib', 'index.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'graceful-fs', 'graceful-fs.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'htmlparser2', 'lib', 'index.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'minimatch', 'minimatch.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'request', 'index.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'request', 'request.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'superstring', 'index.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'temp', 'lib', 'temp.js'),
        ) ||
        requiredModuleRelativePath.endsWith(
          path.join('node_modules', 'parse5', 'lib', 'index.js'),
        ) ||
        requiredModuleRelativePath === path.join('..', 'exports', 'atom.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'src', 'electron-shims.js') ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'atom-keymap',
            'lib',
            'command-event.js',
          ) ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'babel-core', 'index.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'debug', 'node.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'git-utils', 'src', 'git.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'glob', 'glob.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'iconv-lite', 'lib', 'index.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'less', 'index.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'less', 'lib', 'less', 'fs.js') ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'less',
            'lib',
            'less-node',
            'index.js',
          ) ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'lodash.isequal', 'index.js') ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'node-fetch',
            'lib',
            'fetch-error.js',
          ) ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'oniguruma', 'src', 'oniguruma.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'resolve', 'index.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'resolve', 'lib', 'core.js') ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'settings-view',
            'node_modules',
            'glob',
            'glob.js',
          ) ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'spell-check',
            'lib',
            'locale-checker.js',
          ) ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'spell-check',
            'lib',
            'system-checker.js',
          ) ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'spellchecker',
            'lib',
            'spellchecker.js',
          ) ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'spelling-manager',
            'node_modules',
            'natural',
            'lib',
            'natural',
            'index.js',
          ) ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'tar', 'tar.js') ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'ls-archive',
            'node_modules',
            'tar',
            'tar.js',
          ) ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'tmp', 'lib', 'tmp.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'tree-sitter', 'index.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'yauzl', 'index.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'util-deprecate', 'node.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'winreg', 'lib', 'registry.js') ||
        requiredModuleRelativePath ===
          path.join('..', 'node_modules', 'scandal', 'lib', 'scandal.js') ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            '@atom',
            'fuzzy-native',
            'lib',
            'main.js',
          ) ||
        requiredModuleRelativePath ===
          path.join(
            '..',
            'node_modules',
            'vscode-ripgrep',
            'lib',
            'index.js',
          ) ||
        // The startup-time script is used by both the renderer and the main process and having it in the
        // snapshot causes issues.
        requiredModuleRelativePath === path.join('..', 'src', 'startup-time.js')
      )
    },
  })

  await fs.writeFile(snapshotScriptPath, snapshotScript)

  try {
    vm.runInNewContext(snapshotScript, undefined, { filename: snapshotScriptPath, displayErrors: true })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  childProcess.spawnSync('node', ['node_modules/electron-mksnapshot/mksnapshot.js', '/Users/ryanm/v8-snapshots/tg-webpack/packages/server/server-snapshot.js'])

  const files = ['snapshot_blob.bin', 'v8_context_snapshot.x86_64.bin']

  for (const file of files) {
    await fs.rename(path.join(__dirname, file), path.join(__dirname, 'packages', 'electron', 'dist', 'Cypress', 'Cypress.app', 'Contents', 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Resources', file))
  }
}

run()
