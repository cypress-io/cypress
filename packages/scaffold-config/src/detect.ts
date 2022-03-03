import { satisfies } from 'compare-versions'
import type { Bundler, PkgJson, FrontendFramework } from './types'
import { FRONTEND_FRAMEWORKS } from './frameworks'

export interface Detector {
  version: string
  dependency: string
}

interface DetectFramework {
  framework?: FrontendFramework
  bundler?: Bundler
}

const bundlers = [
  {
    type: 'vite',
    detectors: [
      {
        dependency: 'vite',
        version: '>=2.0.0',
      },
    ],
  },
  {
    type: 'webpack4',
    detectors: [
      {
        dependency: 'webpack',
        version: '^4.0.0',
      },
    ],
  },
  {
    type: 'webpack5',
    detectors: [
      {
        dependency: 'webpack',
        version: '^5.0.0',
      },
    ],
  },
] as const

// Detect the framework, which can either be a tool like Create React App,
// in which case we just return the framework. The user cannot change the
// bundler.

// If we don't find a specific framework, but we do find a library and/or
// bundler, we return both the framework, which might just be "React",
// and the bundler, which could be Vite.
export function detect (pkg: PkgJson): DetectFramework {
  const inPkgJson = (detector: Detector) => {
    const vers = pkg.dependencies?.[detector.dependency] || pkg.devDependencies?.[detector.dependency]
    const found = (vers && satisfies(vers, detector.version)) ?? false

    return found
  }

  // first see if it's a template
  for (const framework of FRONTEND_FRAMEWORKS.filter((x) => x.family === 'template')) {
    const hasAllDeps = [...framework.detectors].every(inPkgJson)

    // so far all the templates we support only have 1 bundler,
    // for example CRA only works with webpack,
    // but we want to consider in the future, tools like Nuxt ship
    // both a webpack and vite dev-env.
    // if we support this, we will also need to attempt to infer the dev server of choice.
    if (hasAllDeps && framework.supportedBundlers.length === 1) {
      return {
        framework,
      }
    }
  }

  // if not a template, they probably just installed/configured on their own.
  for (const library of FRONTEND_FRAMEWORKS.filter((x) => x.family === 'library')) {
    // multiple bundlers supported, eg React works with webpack and Vite.
    // try to infer which one they are using.
    const hasLibrary = [...library.detectors].every(inPkgJson)

    for (const bundler of bundlers) {
      const hasBundler = [...bundler.detectors].every(inPkgJson)

      if (hasLibrary && hasBundler) {
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
