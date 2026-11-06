import { describe, it, expect, vi, beforeEach } from 'vitest'
import { overrideChaiUtil } from '../../../../src/cy/chai/override_util'
import * as moduleNamespace from '../../../../src/cy/chai/override_util'

const debug = vi.hoisted(() => vi.fn())

vi.mock('debug', () => ({ default: () => debug }))

describe('overrideChaiUtil', () => {
  const replacement = () => 'cypress'

  beforeEach(() => {
    debug.mockClear()
  })

  it('replaces writable functions', () => {
    const util = { inspect: () => 'chai' }

    overrideChaiUtil(util, { inspect: replacement })

    expect(util.inspect).toBe(replacement)
    expect(debug).not.toHaveBeenCalled()
  })

  it('leaves getter-only functions in place without throwing', () => {
    const original = () => 'chai'
    const util = Object.defineProperty({}, 'inspect', { get: () => original, enumerable: true })

    expect(() => overrideChaiUtil(util, { inspect: replacement })).not.toThrow()
    expect(util['inspect']).toBe(original)
  })

  it('leaves a module namespace unchanged without throwing', () => {
    expect(() => overrideChaiUtil(moduleNamespace, { overrideChaiUtil: replacement })).not.toThrow()
    expect(moduleNamespace.overrideChaiUtil).not.toBe(replacement)
  })

  it('logs each function it could not replace', () => {
    const util = Object.defineProperty({ objDisplay: () => 'chai' }, 'inspect', { get: () => () => 'chai' })

    overrideChaiUtil(util, { inspect: replacement, objDisplay: replacement })

    expect(debug).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledWith(expect.any(String), 'inspect', 'inspect')
  })
})
