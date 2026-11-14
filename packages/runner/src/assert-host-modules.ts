import { HOST_MODULES_GLOBAL, HOST_MODULE_SPECIFIERS } from '@packages/types/src/host-modules'

// A missing module otherwise fails at its first external import with an
// unclear TypeError, so fail here first with an error that names the contract.
const hostModules: unknown = Reflect.get(window, HOST_MODULES_GLOBAL)
const missing = HOST_MODULE_SPECIFIERS.filter((specifier) => {
  return !(typeof hostModules === 'object' && hostModules !== null && Reflect.get(hostModules, specifier))
})

if (missing.length) {
  throw new Error(`cypress_runner.js needs window.${HOST_MODULES_GLOBAL} to provide ${missing.join(', ')}. Load it through the app's injectBundle, which publishes them first.`)
}
