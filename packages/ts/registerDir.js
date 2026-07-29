// @ts-check
const Module = require('module')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('cypress:ts')

let registered = false

// tsx resolves a co-located `.js` before its `.ts`/`.tsx` source. ts-node used
// `preferTsExts: true` to do the opposite, which matters when a package has been
// built in-place (compiled `.js` sitting next to the `.ts`). This shim restores
// that preference for our first-party source while leaving third-party packages in
// `node_modules` (which ship `.js` without a `.ts` sibling) untouched.
function installPreferTsExtsShim () {
  const originalResolveFilename = Module._resolveFilename

  Module._resolveFilename = function (request, parent, isMain, options) {
    const resolved = originalResolveFilename.call(this, request, parent, isMain, options)

    if (
      typeof resolved === 'string' &&
      resolved.endsWith('.js') &&
      !resolved.includes(`${path.sep}node_modules${path.sep}`)
    ) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = `${resolved.slice(0, -'.js'.length)}${ext}`

        if (fs.existsSync(candidate)) {
          return candidate
        }
      }
    }

    return resolved
  }
}

// In development we install a require-time TypeScript hook (tsx) so `.ts` sources can
// be loaded without a separate build step. In production/staging the V8 snapshot
// handles module loading, so this is skipped (see the snapshot guard below).
module.exports = function () {
  // Only set up the hook when the V8 snapshot is not in use.
  // @ts-ignore getSnapshotResult is a global defined in the v8 snapshot
  if (!(['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE) || typeof getSnapshotResult === 'undefined')) {
    return
  }

  if (registered) {
    return
  }

  // Avoid double-compiling when running Cypress-in-Cypress, which already has a hook installed.
  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    debug('skipping TypeScript require hook registration while testing the app')

    return
  }

  try {
    debug('registering tsx require hook')
    // register the tsx CommonJS require hook for on-demand TypeScript transpilation
    // @see https://tsx.is/dev-api/register-cjs
    require('tsx/cjs/api').register()
    installPreferTsExtsShim()
    registered = true
  } catch (e) {
    // continue running without a TypeScript require hook
    debug('running without tsx hook in environment "%s": %o', process.env.CYPRESS_INTERNAL_ENV, e)
  }
}
