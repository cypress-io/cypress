/**
 * The app publishes these modules on `window[HOST_MODULES_GLOBAL]` before it
 * injects `cypress_runner.js`, and the runner's webpack build marks them as
 * externals that read from that global. React and MobX keep module-level
 * state (hooks dispatcher, observable tracking), so the page needs exactly one
 * copy of each for the reporter, the app's MobX runner store and Cloud
 * bundles to work together.
 */
export const HOST_MODULES_GLOBAL = '__CYPRESS_HOST_MODULES__'

export const HOST_MODULE_SPECIFIERS = [
  'react',
  'react-dom',
  'react-dom/client',
  'mobx',
] as const

export type HostModuleSpecifier = typeof HOST_MODULE_SPECIFIERS[number]
