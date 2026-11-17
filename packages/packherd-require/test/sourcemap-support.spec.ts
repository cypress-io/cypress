import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

class FakeCallSite {
  getFileName () {
    return '/project/bundle.js'
  }

  getScriptNameOrSourceURL () {
    return '/project/bundle.js'
  }

  getLineNumber () {
    return 1
  }

  getColumnNumber () {
    return 100
  }

  getFunctionName () {
    return 'fn'
  }

  isEval () {
    return false
  }

  isNative () {
    return false
  }

  isConstructor () {
    return false
  }

  isToplevel () {
    return true
  }
}

const emptyCache = {
  get: () => undefined,
  addAsync: async () => {},
  add: () => {},
  clearSync: () => {},
}

// The header check runs once at module load against process.version, so each
// version needs a fresh copy of the module.
const stackFrameForNodeVersion = async (version: string) => {
  vi.resetModules()
  Object.defineProperty(process, 'version', { value: version, configurable: true })

  const { installSourcemapSupport } = await import('../src/sourcemap-support')

  installSourcemapSupport(emptyCache, '/project')

  // Safe because installSourcemapSupport always assigns prepareStackTrace, and the
  // fake frame implements every CallSite method the stack formatter reads
  const prepareStackTrace = Error.prepareStackTrace as (err: Error, stack: any[]) => string

  return prepareStackTrace(new Error('boom'), [new FakeCallSite()])
}

describe('sourcemap support', () => {
  const originalVersion = process.version
  const originalPrepareStackTrace = Error.prepareStackTrace

  beforeEach(() => {
    Error.prepareStackTrace = originalPrepareStackTrace
  })

  afterEach(() => {
    Object.defineProperty(process, 'version', { value: originalVersion, configurable: true })
    Error.prepareStackTrace = originalPrepareStackTrace
    vi.resetModules()
  })

  describe('Node versions that no longer prepend the module wrapper header', () => {
    for (const version of [
      'v10.16.0',
      'v10.19.3',
      'v10.20.1',
      'v10.99.0',
      'v10.100.0',
      'v11.11.0',
      'v12.0.0',
      'v19.9.0',
      'v20.0.0',
      'v24.22.1',
      'v99.1.0',
      'v100.0.0',
    ]) {
      it(`keeps the first-line column on ${version}`, async () => {
        expect(await stackFrameForNodeVersion(version)).toEqual('Error: boom\n    at fn (/project/bundle.js:1:101)\n')
      })
    }
  })

  describe('Node versions that prepend the module wrapper header', () => {
    for (const version of [
      'v1.8.4',
      'v8.17.0',
      'v9.11.2',
      'v10.1.0',
      'v10.9.0',
      'v10.15.3',
      'v11.10.1',
    ]) {
      it(`subtracts the header from the first-line column on ${version}`, async () => {
        expect(await stackFrameForNodeVersion(version)).toEqual('Error: boom\n    at fn (/project/bundle.js:1:39)\n')
      })
    }
  })
})
