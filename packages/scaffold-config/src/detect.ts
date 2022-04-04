import { WIZARD_FRAMEWORKS, inPkgJson } from './frameworks'
import { WIZARD_BUNDLERS } from './dependencies'

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
export function detect (projectPath: string): DetectFramework {
  // first see if it's a template
  for (const framework of WIZARD_FRAMEWORKS.filter((x) => x.family === 'template')) {
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
  for (const library of WIZARD_FRAMEWORKS.filter((x) => x.family === 'library')) {
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
