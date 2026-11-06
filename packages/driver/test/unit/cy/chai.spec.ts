/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import chai from 'chai'
import * as $chai from '../../../src/cy/chai'
import { inspect, objDisplay } from '../../../src/cy/chai/display'
import type { StateFunc } from '../../../src/cypress/state'

const createForSpec = () => {
  // Safe because create() only reads `Error` from the spec window and assigns
  // the chai globals onto it, and keeps `state` for assertions without
  // calling it.
  const specWindow = { Error } as unknown as SpecWindow
  const state = vi.fn() as unknown as StateFunc

  $chai.create!(specWindow, state, vi.fn())
}

describe('src/cy/chai', () => {
  it('points chai.util at Cypress formatters for each spec', () => {
    createForSpec()

    expect(chai.util.inspect).toBe(inspect)
    expect(chai.util.objDisplay).toBe(objDisplay)

    const getMessage = chai.util.getMessage

    // a previous spec replaced the formatters
    chai.util.inspect = () => 'replaced'
    chai.util.objDisplay = () => 'replaced'
    chai.util.getMessage = () => 'replaced'

    createForSpec()

    expect(chai.util.inspect).toBe(inspect)
    expect(chai.util.objDisplay).toBe(objDisplay)
    expect(chai.util.getMessage).toBe(getMessage)
  })
})
