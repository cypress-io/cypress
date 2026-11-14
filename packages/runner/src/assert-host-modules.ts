import { HOST_MODULES_GLOBAL } from '@packages/types/src/host-modules'

// React, ReactDOM and MobX are webpack externals read from this global. Without
// it, the first import of any of them fails with an unclear TypeError, so fail
// here first with an error that names the contract.
if (!(HOST_MODULES_GLOBAL in window)) {
  throw new Error(`cypress_runner.js needs window.${HOST_MODULES_GLOBAL}. Load it through the app's injectBundle, which publishes React, ReactDOM and MobX first.`)
}
