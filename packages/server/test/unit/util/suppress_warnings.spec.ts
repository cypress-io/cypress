import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const TLS_WARNING = 'Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to \'0\' makes TLS connections and HTTPS requests insecure by disabling certificate verification.'

// `suppress` is a one-shot guarded by module state, so each test loads a fresh copy
const loadSuppress = async () => {
  vi.resetModules()

  const { suppress } = await import('../../../lib/util/suppress_warnings')

  return suppress
}

describe('lib/util/suppress_warnings', function () {
  let originalEmitWarning: typeof process.emitWarning

  beforeEach(() => {
    originalEmitWarning = process.emitWarning
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.emitWarning = originalEmitWarning
  })

  it('passes through non-TLS warnings when suppressed', async () => {
    const emitWarning = vi.spyOn(process, 'emitWarning')
    const suppress = await loadSuppress()

    suppress()
    process.emitWarning('some unrelated warning')

    expect(emitWarning).toHaveBeenCalledOnce()
  })

  it('suppresses NODE_TLS_REJECT_UNAUTHORIZED warnings', async () => {
    const emitWarning = vi.spyOn(process, 'emitWarning')
    const suppress = await loadSuppress()

    suppress()
    process.emitWarning(TLS_WARNING)
    process.emitWarning(TLS_WARNING)

    expect(emitWarning).not.toHaveBeenCalled()
  })

  it('does not emit buffer deprecation warnings', async () => {
    const emitWarning = vi.spyOn(process, 'emitWarning')
    const suppress = await loadSuppress()

    suppress()

    new Buffer(0)

    new Buffer('asdf')

    expect(emitWarning).not.toHaveBeenCalled()
  })
})
