import type { BUNDLER_DEPS, STORYBOOK_DEPS, CODE_GEN_FRAMEWORKS, DEPENDENCIES } from './constants'
import type { FRONTEND_FRAMEWORKS } from './configFiles'

export type AllPackages = FrontendFramework['packages'][number]
| typeof BUNDLER_DEPS[number]
| typeof STORYBOOK_DEPS[number]

export type AllPackageNames = typeof DEPENDENCIES[number]['name']

export type AllPackagePackages = typeof DEPENDENCIES[number]['package']

export type AllPackageTypes = FrontendFramework['type'] | Bundler['type']

export type Bundler = typeof BUNDLER_DEPS[number]

export type CodeGenFramework = typeof CODE_GEN_FRAMEWORKS[number]

export type FrontendFramework = typeof FRONTEND_FRAMEWORKS[number]

export type PkgJson = { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }
