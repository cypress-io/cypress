import { WIZARD_FRAMEWORKS, inPkgJson } from './frameworks'
import { WIZARD_BUNDLERS } from './dependencies'
import path from 'path'
import fs from 'fs-extra'
import globby from 'globby'
import type { PkgJson } from '.'

interface DetectFramework {
  framework?: typeof WIZARD_FRAMEWORKS[number]
  bundler?: typeof WIZARD_BUNDLERS[number]
}

// Detect the framework, which can either be a tool like Create React App,
// in which case we just return the framework. The user cannot change the
// bundler.

// If we don't find a specific framework, but we do find a library and/or
// bundler, we return both the framework, which might just be "React",
// and the bundler, which could be Vite.
export function detectFramework (projectPath: string): DetectFramework {
  // first see if it's a template
  for (const framework of WIZARD_FRAMEWORKS.filter((x) => x.category === 'template')) {
    const hasAllDeps = [...framework.detectors].every((dep) => {
      return inPkgJson(dep, projectPath).satisfied
    })

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
  for (const library of WIZARD_FRAMEWORKS.filter((x) => x.category === 'library')) {
    // multiple bundlers supported, eg React works with webpack and Vite.
    // try to infer which one they are using.
    const hasLibrary = [...library.detectors].every((dep) => inPkgJson(dep, projectPath).satisfied)

    for (const bundler of WIZARD_BUNDLERS) {
      const detectBundler = inPkgJson(bundler, projectPath)

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
 *   ELSE IF `typescript` dependency in `package.json` OR `tsconfig.json` in `projectRoot/*`
 *     HAS TYPESCRIPT
 *   ELSE
 *     DOES NOT HAVE TYPESCRIPT
 *   END
 * ELSE IF HAS CYPRESS_JSON
 *   IF cypress/* contains *.ts file
 *     USE TYPESCRIPT
 *   ELSE
 *     DO NOT USE TYPESCRIPT
 *   END
 * ELSE IS NEW PROJECT
 *   IF `typescript` dependency in `package.json` OR `tsconfig.json` in `projectRoot/*`
 *     HAS TYPESCRIPT
 *   ELSE
 *     DOES NOT HAVE TYPESCRIPT
 *   END
 * END
 */

export function detectLanguage (projectRoot: string, pkgJson: PkgJson): 'js' | 'ts' {
  try {
    if (fs.existsSync(path.join(projectRoot, 'cypress.config.ts'))) {
      return 'ts'
    }

    if (fs.existsSync(path.join(projectRoot, 'cypress.config.js'))) {
      return 'js'
    }
  } catch (e) {
    //
  }

  try {
    if ('typescript' in (pkgJson.dependencies || {}) || 'typescript' in (pkgJson.devDependencies || {})) {
      return 'ts'
    }
  } catch (e) {
    //
  }

  const joinPosix = (...s: string[]) => {
    return path.join(...s).split(path.sep).join(path.posix.sep)
  }

  const globs = [
    joinPosix(projectRoot, '**/*tsconfig.json'),
    joinPosix(projectRoot, 'cypress', '**/*.{ts,tsx}'),
  ]

  const tsFiles = globby.sync(globs, { onlyFiles: true })

  if (tsFiles.length > 0) {
    return 'ts'
  }

  return 'js'
}
