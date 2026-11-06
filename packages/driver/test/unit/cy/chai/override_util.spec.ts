import { describe, it, expect } from 'vitest'
import { overrideChaiUtil } from '../../../../src/cy/chai/override_util'
import * as moduleNamespace from '../../../../src/cy/chai/override_util'

describe('overrideChaiUtil', () => {
  const replacement = () => 'cypress'

  it('replaces writable functions', () => {
    const util = { inspect: () => 'chai' }

    overrideChaiUtil(util, { inspect: replacement })

    expect(util.inspect).toBe(replacement)
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
})
