import { isDependencyInstalled, WizardBundler } from './frameworks'
import { WIZARD_BUNDLERS } from './dependencies'
import path from 'path'
import fs from 'fs'
import globby from 'globby'
import type { PkgJson } from '.'
import Debug from 'debug'

const debug = Debug('cypress:scaffold-config:detect')

interface DetectFramework {
  framework?: Cypress.ResolvedComponentFrameworkDefinition
  bundler?: WizardBundler['type']
}

export async function areAllDepsSatisfied (projectPath: string, framework: Cypress.ResolvedComponentFrameworkDefinition) {
  for (const dep of framework.detectors) {
    const result = await isDependencyInstalled(dep, projectPath)

    if (!result.satisfied) {
      return false
    }
  }

  return true
}

// Detect the framework, which can either be a tool like Next.js,
// in which case we just return the framework. The user cannot change the
// bundler.

// If we don't find a specific framework, but we do find a library and/or
// bundler, we return both the framework, which might just be "React",
// and the bundler, which could be Vite.
export async function detectFramework (projectPath: string, frameworks: Cypress.ResolvedComponentFrameworkDefinition[]): Promise<DetectFramework> {
  // first see if it's a template
  for (const framework of frameworks.filter((x) => x.category === 'template')) {
    const hasAllDeps = await areAllDepsSatisfied(projectPath, framework)

    // so far all the templates we support only have 1 bundler,
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
  for (const library of frameworks.filter((x) => x.category === 'library')) {
    // multiple bundlers supported, eg React works with webpack and Vite.
    // try to infer which one they are using.
    const hasLibrary = await areAllDepsSatisfied(projectPath, library)

    for (const bundler of WIZARD_BUNDLERS) {
      const detectBundler = await isDependencyInstalled(bundler, projectPath)

      if (hasLibrary && detectBundler.satisfied) {
        return {
          framework: library,
          bundler: bundler.type,
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

/**
 * Detect the language the current project is using
 *
 * If `cypress.config` exists, we derive the language
 * from the extension.
 *
 * IF HAS_CUSTOM_CYPRESS_CONFIG
 *   IF CYPRESS_CONFIG_TS
 *     HAS TYPESCRIPT
 *   ELSE
 *     DOES NOT HAVE TYPESCRIPT
 * IF HAS_DEFAULT_CYPRESS_CONFIG
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

type DetectLanguageParams = {
  projectRoot: string
  customConfigFile?: string | null
  pkgJson: PkgJson
  isMigrating?: boolean
}

export function detectLanguage ({ projectRoot, customConfigFile, pkgJson, isMigrating = false }: DetectLanguageParams): 'js' | 'ts' {
  try {
    if (customConfigFile) {
      debug('Evaluating custom Cypress config file \'%s\'', customConfigFile)

      // .ts, .mts extensions
      if (/\.[m]?ts$/i.test(customConfigFile)) {
        debug('Custom config file is Typescript - using TS')

        return 'ts'
      }

      // .js, .cjs, .mjs extensions
      if (/\.[c|m]?js$/i.test(customConfigFile)) {
        debug('Custom config file is Javascript - using JS')

        return 'js'
      }

      debug('Unable to determine language from custom Cypress config file extension')
    }

    debug('Checking for default Cypress config file')

    for (let extension of ['ts', 'mts']) {
      if (fs.existsSync(path.join(projectRoot, `cypress.config.${extension}`))) {
        debug(`Detected cypress.config.${extension} - using TS`)

        return 'ts'
      }
    }

    for (let extension of ['js', 'cjs', 'mjs']) {
      if (fs.existsSync(path.join(projectRoot, `cypress.config.${extension}`))) {
        debug(`Detected cypress.config.${extension} - using JS`)

        return 'js'
      }
    }
  } catch (e) {
    debug('Did not find cypress.config file')
  }

  // If we can't find an installed TypeScript, there's no way we can assume the project is using TypeScript,
  // because it won't work on the next step of installation anyway
  try {
    const typescriptFile = require.resolve('typescript', { paths: [projectRoot] })

    debug('Resolved typescript from %s', typescriptFile)
  } catch {
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

  const joinPosix = (...s: string[]) => {
    return path.join(...s).split(path.sep).join(path.posix.sep)
  }

  const globs = [
    joinPosix('cypress', '**/*.{ts,tsx}'),
  ]

  if (!isMigrating) {
    globs.push(joinPosix('**/*tsconfig.json'))
  }

  const tsFiles = globby.sync(globs, { onlyFiles: true, gitignore: true, cwd: projectRoot, ignore: ['node_modules'] })

  if (tsFiles.filter((f) => !f.endsWith('.d.ts')).length > 0) {
    debug(`Detected ts file(s) ${tsFiles.join(',')} - using TS`)

    return 'ts'
  }

  debug('Defaulting to JS')

  return 'js'
}
