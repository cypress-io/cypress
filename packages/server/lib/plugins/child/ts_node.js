// @ts-check
const debugLib = require('debug')
const path = require('path')
const tsnode = require('ts-node')
const resolve = require('../../util/resolve')
const semver = require('semver')

const debug = debugLib('cypress:server:ts-node')

const getTsNodeOptions = (tsPath, registeredFile) => {
  const version = require(tsPath).version || '0.0.0'

  /**
   * NOTE: This circumvents a limitation of ts-node
   *
   * The "preserveValueImports" option was introduced in TypeScript 4.5.0
   * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#disabling-import-elision
   *
   * If we pass an unknown compiler option to ts-node,
   * it ignores all options passed.
   * If we want `module: "commonjs"` to always be used,
   * we need to only set options that are supported in this version of TypeScript.
   */
  const compilerOptions = {
    module: 'commonjs',
    ...(semver.satisfies(version, '>=4.5.0')
      // Only adding this option for TS >= 4.5.0
      ? { preserveValueImports: false }
      : {}
    ),
  }

  let compiler = tsPath

  if (process.env.TS_NODE_COMPILER) {
    try {
      compiler = require.resolve(process.env.TS_NODE_COMPILER, { paths: [path.dirname(registeredFile)] })
    } catch {
      // ts-node compiler not installed in project directory
    }
  }

  /**
   * @type {import('ts-node').RegisterOptions}
   */
  const opts = {
    compiler, // use the user's installed typescript
    compilerOptions,
    // resolves tsconfig.json starting from the plugins directory
    // instead of the cwd (the project root)
    dir: path.dirname(registeredFile),
    transpileOnly: true, // transpile only (no type-check) for speed
  }

  return opts
}

const register = (projectRoot, registeredFile) => {
  try {
    debug('projectRoot path: %s', projectRoot)
    debug('registeredFile: %s', registeredFile)
    const tsPath = resolve.typescript(projectRoot)

    if (!tsPath) return

    debug('typescript path: %s', tsPath)

    const tsOptions = getTsNodeOptions(tsPath, registeredFile)

    debug('registering project TS with options %o', tsOptions)

    require('tsconfig-paths/register')
    tsnode.register(tsOptions)
  } catch (err) {
    debug(`typescript doesn't exist. ts-node setup failed.`)
    debug('error message: %s', err.message)
  }
}

module.exports = {
  register,
}
