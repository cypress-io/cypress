import type { BUNDLERS, STORYBOOK_DEPS, CODE_GEN_FRAMEWORKS, DEPENDENCIES } from './constants'
import type { FRONTEND_FRAMEWORKS } from './frameworks'

export type AllPackages = FrontendFramework['packages'][number]
| typeof BUNDLERS[number]['package']
| typeof STORYBOOK_DEPS[number]

export type AllPackageNames = typeof DEPENDENCIES[number]['name']

export type AllPackagePackages = typeof DEPENDENCIES[number]['package']

export type AllPackagesDescriptions = typeof DEPENDENCIES[number]['description']

export type Bundler = typeof BUNDLERS[number]['package']

export type CodeGenFramework = typeof CODE_GEN_FRAMEWORKS[number]

export type FrontendFramework = typeof FRONTEND_FRAMEWORKS[number]

export type PkgJson = { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }
