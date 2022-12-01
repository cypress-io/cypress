'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.detectLanguage = exports.detectFramework = exports.areAllDepsSatisified = void 0

const tslib_1 = require('tslib')
const frameworks_1 = require('./frameworks')
const dependencies_1 = require('./dependencies')
const path_1 = tslib_1.__importDefault(require('path'))
const fs_1 = tslib_1.__importDefault(require('fs'))
const globby_1 = tslib_1.__importDefault(require('globby'))
const debug_1 = tslib_1.__importDefault(require('debug'))
const debug = (0, debug_1.default)('cypress:scaffold-config:detect')

async function areAllDepsSatisified (projectPath, framework) {
  for (const dep of framework.detectors) {
    const result = await (0, frameworks_1.isDependencyInstalled)(dep, projectPath)

    if (!result.satisfied) {
      return false
    }
  }

  return true
}
exports.areAllDepsSatisified = areAllDepsSatisified

// Detect the framework, which can either be a tool like Create React App,
// in which case we just return the framework. The user cannot change the
// bundler.
// If we don't find a specific framework, but we do find a library and/or
// bundler, we return both the framework, which might just be "React",
// and the bundler, which could be Vite.
async function detectFramework (projectPath) {
  // first see if it's a template
  for (const framework of frameworks_1.WIZARD_FRAMEWORKS.filter((x) => x.category === 'template')) {
    const hasAllDeps = await areAllDepsSatisified(projectPath, framework)

    // so far all the templates we support only have 1 bundler,
    // for example CRA only works with webpack,
    // but we want to consider in the future, tools like Nuxt ship
    // both a webpack and vite dev-env.
    // if we support this, we will also need to attempt to infer the dev server of choice.
    if (hasAllDeps && framework.supportedBundlers.length === 1) {
      return {
        framework,
        bundler: framework.supportedBundlers[0],
      }
    }
  }
  // if not a template, they probably just installed/configured on their own.
  for (const library of frameworks_1.WIZARD_FRAMEWORKS.filter((x) => x.category === 'library')) {
    // multiple bundlers supported, eg React works with webpack and Vite.
    // try to infer which one they are using.
    const hasLibrary = await areAllDepsSatisified(projectPath, library)

    for (const bundler of dependencies_1.WIZARD_BUNDLERS) {
      const detectBundler = await (0, frameworks_1.isDependencyInstalled)(bundler, projectPath)

      if (hasLibrary && detectBundler.satisfied) {
        return {
          framework: library,
          bundler,
        }
      }
    }
    if (hasLibrary) {
      // unknown bundler, or we couldn't detect it
      // just return the framework, leave the rest to the user.
      return {
        framework: library,
      }
    }
  }

  return {
    framework: undefined,
    bundler: undefined,
  }
}
exports.detectFramework = detectFramework

/**
 * Detect the language the current project is using
 *
 * If `cypress.config` exists, we derive the language
 * from the extension.
 *
 * IF HAS_CYPRESS_CONFIG
 *   IF CYPRESS_CONFIG_TS
 *     HAS TYPESCRIPT
 *   ELSE
 *     DOES NOT HAVE TYPESCRIPT
 *   ELSE IF `typescript` dependency in `package.json` AND `tsconfig.json` in `projectRoot/*`
 *     HAS TYPESCRIPT
 *   ELSE
 *     DOES NOT HAVE TYPESCRIPT
 *   END
 * ELSE IF HAS CYPRESS_JSON
 *   IF cypress/* contains non-dts *.ts file
 *     USE TYPESCRIPT
 *   ELSE
 *     DO NOT USE TYPESCRIPT
 *   END
 * ELSE IS NEW PROJECT
 *   IF `typescript` dependency in `package.json` AND `tsconfig.json` in `projectRoot/*`
 *     HAS TYPESCRIPT
 *   ELSE
 *     DOES NOT HAVE TYPESCRIPT
 *   END
 * END
 */
function detectLanguage ({ projectRoot, pkgJson, isMigrating = false }) {
  try {
    if (fs_1.default.existsSync(path_1.default.join(projectRoot, 'cypress.config.ts'))) {
      debug('Detected cypress.config.ts - using TS')

      return 'ts'
    }

    if (fs_1.default.existsSync(path_1.default.join(projectRoot, 'cypress.config.js'))) {
      debug('Detected cypress.config.js - using JS')

      return 'js'
    }
  } catch (e) {
    debug('Did not find cypress.config file')
  }
  // If we can't find an installed TypeScript, there's no way we can assume the project is using TypeScript,
  // because it won't work on the next step of installation anyway
  try {
    const typescriptFile = require.resolve('typescript', { paths: [projectRoot] })

    debug('Resolved typescript from %s', typescriptFile)
  } catch (_a) {
    debug('No typescript installed - using js')

    return 'js'
  }
  const allDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
  }

  if ('typescript' in allDeps) {
    debug('Detected typescript in package.json - using TS')

    return 'ts'
  }

  const joinPosix = (...s) => {
    return path_1.default.join(...s).split(path_1.default.sep).join(path_1.default.posix.sep)
  }
  const globs = [
    joinPosix('cypress', '**/*.{ts,tsx}'),
  ]

  if (!isMigrating) {
    globs.push(joinPosix('**/*tsconfig.json'))
  }

  const tsFiles = globby_1.default.sync(globs, { onlyFiles: true, gitignore: true, cwd: projectRoot, ignore: ['node_modules'] })

  if (tsFiles.filter((f) => !f.endsWith('.d.ts')).length > 0) {
    debug(`Detected ts file(s) ${tsFiles.join(',')} - using TS`)

    return 'ts'
  }

  debug('Defaulting to JS')

  return 'js'
}
exports.detectLanguage = detectLanguage
