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

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
  }

  const getIgnoreRegex = ({ configDir, currentFileDir, sep }) => {
    const configPathArray = configDir.split(sep)

    const ignoreRegexArray = currentFileDir.replace(/[\/|\\]packages[\/|\\]server[\/|\\].*/, '').split(sep)

    for (let index = 0; index < configPathArray.length; index++) {
      if (configPathArray[index] === ignoreRegexArray[0]) {
        ignoreRegexArray.shift()
      } else {
        break
      }
    }

    ignoreRegexArray.push('packages')

    return escapeRegExp(`/${ignoreRegexArray.join('/')}/`)
  }

  const dir = path.dirname(registeredFile)

  /**
   * @type {import('ts-node').RegisterOptions}
   */
  const opts = {
    compiler, // use the user's installed typescript
    compilerOptions,
    ignore: [
      // default ignore
      '(?:^|/)node_modules/',
      // do not transpile cypress resources
      //Find the substring starting with packages/server, remove it and add packages back.
      getIgnoreRegex({ configDir: dir, currentFileDir: __dirname, sep: path.sep }),
      // getIgnoreRegex('/Users/matthenkes/Source/testing-ts-child-process', '/Users/matthenkes/Library/Caches/Cypress/beta-12.8.1-matth/misc/telemetry-ae1b6a2c/Cypress.app/Contents/Resources/app/packages/server/dist/span-exporters/ipc-span-exporter.js', path.sep),
      // getIgnoreRegex('C:\\Users\\circleci\\AppData\\Local\\Temp\\cy-projects\\runner-e2e-specs', 'C:\\Users\\circleci\\cypress\\packages\\server\\dist\\span-exporters\\ipc-span-exporter.js', '\\'),
      // escapeRegExp(path.join(__dirname.replace(/[\/|\\]packages[\/|\\]server[\/|\\].*/, ''), 'packages')),
      ...(process.env.MATT_REGEX_TEST ? [process.env.MATT_REGEX_TEST] : []),
    ],
    // resolves tsconfig.json starting from the plugins directory
    // instead of the cwd (the project root)
    dir,
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
    // eslint-disable-next-line no-console
    console.log('VIKING registering project TS with options %o', tsOptions)

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
