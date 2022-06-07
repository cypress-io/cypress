/* eslint-disable no-console */
import gracefulFs from 'graceful-fs'
import type fs from 'fs'
// import Module from 'module'

const warnedStacks: string[] = []

function shouldIgnoreSyncCall () {
  const stack = (new Error).stack!

  // @ts
  const shouldIgnore = false
    || /(source-map-support|Module\.load)/gm.test(stack)
    || warnedStacks.includes(stack)

  warnedStacks.push(stack)

  return shouldIgnore
}

export function patchFs (_fs: typeof fs) {
  // 1. Add gracefulFs for EMFILE queuing.
  gracefulFs.gracefulify(_fs)

  const syncMethods = {}

  if (process.env.CYPRESS_INTERNAL_ENV === 'production') return

  // 2. Warn on all FS sync calls in development.

  for (const k in _fs) {
    if (k === 'existsSync' || !k.endsWith('Sync') || typeof _fs[k] !== 'function') continue

    const originalFn = _fs[k]

    _fs[k] = function patchedFsSync (...args) {
      if (!shouldIgnoreSyncCall()) {
        console.error(`fs.${k} was called but should not have been. Synchronous fs methods should not be used in the App.`)
        console.error((String((new Error).stack).split('\n').slice(2, 15).join('\n')))
      }

      return originalFn.call(_fs, ...args)
    }

    syncMethods[k] = originalFn
  }
}
