import type { BUNDLERS, STORYBOOK_DEPS, CODE_GEN_FRAMEWORKS } from './constants'
import type { FRONTEND_FRAMEWORKS } from './configFiles'

export type AllPackages = FrontendFramework['package']['name'] | Bundler['package'] | typeof STORYBOOK_DEPS[number]

export type AllPackageTypes = FrontendFramework['type'] | Bundler['type']

export type Bundler = typeof BUNDLERS[number]

export type CodeGenFramework = typeof CODE_GEN_FRAMEWORKS[number]

export type FrontendFramework = typeof FRONTEND_FRAMEWORKS[number]
