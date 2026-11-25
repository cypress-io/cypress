const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const esbuild = require('esbuild')
const execa = require('execa')
const { needsSandbox } = require('../../cli/lib/tasks/verify')
const xvfb = require('../../cli/lib/exec/xvfb').default
const meta = require('./meta')

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
// `require.resolve` as a value, so aliases and `require.resolve.paths` are covered too, but not `x.require.resolve`
const REQUIRE_RESOLVE = /(?<![\w$.])require\.resolve\b/g
// a shebang and a directive prologue such as "use strict" must stay ahead of the header to keep their meaning
// eslint-disable-next-line regexp/no-super-linear-backtracking -- the pattern is optional after `^`, so it never fails and never backtracks into earlier iterations, and `yarn check-regex` rates it safe
const FILE_PROLOGUE = /^(#!.*\n)?(?:\s*(?:\/\/.*\n|\/\*[\s\S]*?\*\/)|\s*(['"])use strict\2\s*;?)*/

// Every module keeps its original __filename/__dirname and require.resolve base, so code that reads
// files next to itself or resolves packages still sees its location on disk rather than the bundle's.
const keepModuleLocation = (buildAppDir, requireResolveTargets) => {
  return {
    name: 'keep-module-location',
    setup (build) {
      build.onLoad({ filter: /\.(c?js)$/ }, async (args) => {
        let contents = await fs.readFile(args.path, 'utf8')
        const usesRequireResolve = contents.search(REQUIRE_RESOLVE) !== -1

        if (!usesRequireResolve && !/\b__(?:dirname|filename)\b/.test(contents)) {
          return { contents, loader: 'js' }
        }

        const relativePath = path.relative(buildAppDir, args.path).split(path.sep).join(path.posix.sep)
        let header = `var __filename = require('path').join(__cypressAppDir, ${JSON.stringify(relativePath)}), __dirname = require('path').dirname(__filename);`

        if (usesRequireResolve) {
          for (const [, , request] of contents.matchAll(REQUIRE_RESOLVE_LITERAL)) {
            try {
              requireResolveTargets.add(require.resolve(request, { paths: [path.dirname(args.path)] }))
            } catch {
              // an optional package that is not installed resolves at runtime the same way it would unbundled
            }
          }

          header += `var __cypressRequireResolve = require('module').createRequire(__filename).resolve;`
          contents = contents.replace(REQUIRE_RESOLVE, '__cypressRequireResolve')
        }

        const prologue = contents.match(FILE_PROLOGUE)[0]

        return { contents: `${prologue}${header}${contents.slice(prologue.length)}`, loader: 'js' }
      })
    },
  }
}

// request-promise loads a private copy of @cypress/request by clearing require.cache, which bundled modules
// bypass, so in the bundle it would patch the copy that every other request uses and reject non-2xx responses.
// The bundle requires the exact file resolved here, which is the one kept on disk.
const loadFromDisk = (bundleDir, filter, loadedFromDisk) => {
  return {
    name: 'load-from-disk',
    setup (build) {
      build.onResolve({ filter }, (args) => {
        const resolved = require.resolve(args.path, { paths: [args.resolveDir] })
        const fromBundle = path.relative(bundleDir, resolved).split(path.sep).join(path.posix.sep)

        loadedFromDisk.add(resolved)

        return { path: fromBundle.startsWith('.') ? fromBundle : `./${fromBundle}`, external: true }
      })
    },
  }
}

// The binary loads this bundle instead of requiring the main process module graph file by file.
// Returns the bundled files and the files the bundle still loads from disk, both relative to buildAppDir.
const createStartCypressBundle = async (buildAppDir) => {
  const unixBuildAppDir = buildAppDir.split(path.sep).join(path.posix.sep)
  const bundleDir = path.join(buildAppDir, 'packages/server')
  const loadedFromDisk = new Set()
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
    legalComments: 'external',
    external: ['electron'],
    banner: { js: `const __cypressAppDir = require('path').join(__dirname, '..', '..');` },
    plugins: [
      loadFromDisk(bundleDir, /^@cypress\/request-promise(\/|$)/, loadedFromDisk),
      externalizeUnresolvable(bundleDir, unresolved),
      keepModuleLocation(unixBuildAppDir, loadedFromDisk),
    ],
  })

  console.log(`start-cypress bundle: ${Object.keys(esbuildResult.metafile.inputs).length} modules; left as runtime requires: ${[...unresolved].join(', ') || 'none'}`)

  return {
    bundledDependencies: Object.keys(esbuildResult.metafile.inputs).map((input) => `./${input}`),
    loadedFromDisk: [...loadedFromDisk].map((target) => path.relative(buildAppDir, target).split(path.sep).join(path.posix.sep)),
  }
}

// Replaces packages/server/index.js with a bundle of itself. start-cypress is left out since it has its own bundle.
// Returns the bundled files relative to buildAppDir.
const createServerEntryPointBundle = async (buildAppDir) => {
  const unixBuildAppDir = buildAppDir.split(path.sep).join(path.posix.sep)
  const entryPoint = path.join(buildAppDir, 'packages', 'server', 'index.js')
  // esbuild will not overwrite its own input
  const outdir = await fs.mkdtemp(path.join(os.tmpdir(), 'server-entry-point-'))

  try {
    const esbuildResult = await esbuild.build({
      entryPoints: [path.join(unixBuildAppDir, 'packages/server/index.js')],
      bundle: true,
      outdir,
      platform: 'node',
      metafile: true,
      absWorkingDir: unixBuildAppDir,
      minify: true,
      keepNames: true,
      legalComments: 'external',
      external: [
        './transpile-ts',
        './start-cypress',
        'electron',
      ],
    })

    await fs.copy(path.join(outdir, 'index.js'), entryPoint)

    for (const legalFile of (await fs.readdir(outdir)).filter((file) => file.endsWith('.LEGAL.txt'))) {
      await fs.copy(path.join(outdir, legalFile), path.join(path.dirname(entryPoint), legalFile))
    }

    return Object.keys(esbuildResult.metafile.inputs).filter((input) => input !== 'packages/server/index.js').map((input) => `./${input}`)
  } finally {
    await fs.remove(outdir)
  }
}

// Run the app once so the start bundle's code cache includes the functions that compile during startup
const createStartBundleCodeCache = async () => {
  const args = ['--smoke-test', '--ping=1']

  if (needsSandbox()) {
    args.push('--no-sandbox')
  }

  // read after xvfb.start(), which sets DISPLAY
  const getAppEnv = () => {
    const env = { ...process.env, CYPRESS_INTERNAL_WRITE_START_BUNDLE_CACHE: '1' }

    // only for this build-time run: the shipped cache is made without the build machine's NODE_OPTIONS,
    // and the user's own NODE_OPTIONS still apply when they run Cypress
    delete env.NODE_OPTIONS
    delete env.ELECTRON_RUN_AS_NODE

    return env
  }

  const usingXvfb = xvfb.isNeeded(getAppEnv())

  try {
    if (usingXvfb) {
      await xvfb.start()
    }

    await execa(`${meta.buildAppExecutable()}`, args, { env: getAppEnv(), extendEnv: false })
  } finally {
    if (usingXvfb) {
      await xvfb.stop()
    }
  }
}

module.exports = {
  createStartCypressBundle,
  createServerEntryPointBundle,
  createStartBundleCodeCache,
}
