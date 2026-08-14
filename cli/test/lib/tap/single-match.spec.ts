import { describe, expect, it, vi } from 'vitest'

import { resolveAmbiguity } from '../../../lib/tap/aut/single-match'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

describe('lib/tap/aut/single-match resolveAmbiguity', () => {
  const frame = { frameId: 'aut-frame-id' }

  const makeSession = (count: unknown, execResult?: unknown, exceptionDetails?: unknown) => {
    const createIsolatedWorld = vi.fn().mockResolvedValue({ executionContextId: 42 })
    const callFunctionOn = vi.fn().mockResolvedValue({ result: { value: count }, exceptionDetails })
    const call = vi.fn().mockImplementation(async () => {
      if (execResult instanceof Error) {
        throw execResult
      }

      return execResult
    })

    const session = {
      call,
      client: { Page: { createIsolatedWorld }, Runtime: { callFunctionOn } },
      sessionId: SESSION_ID,
    } as unknown as TapSession

    return { session, call, callFunctionOn, createIsolatedWorld }
  }

  it('lets a selector matching exactly one element through, counting it in the AUT frame', async () => {
    const { session, callFunctionOn, createIsolatedWorld, call } = makeSession({ count: 1 })

    expect(await resolveAmbiguity(session, frame, '.one')).to.be.undefined

    expect(createIsolatedWorld).toHaveBeenCalledWith({ frameId: 'aut-frame-id', worldName: 'cypress-tap' }, SESSION_ID)
    expect(callFunctionOn.mock.calls[0][0]).toMatchObject({
      executionContextId: 42,
      arguments: [{ value: '.one' }],
      returnByValue: true,
    })

    // Nothing to disambiguate, so the instance is never asked for selectors.
    expect(call).not.toHaveBeenCalled()
  })

  it('lets a selector matching nothing through — each command reports that in its own shape', async () => {
    const { session } = makeSession({ count: 0 })

    expect(await resolveAmbiguity(session, frame, '.missing')).to.be.undefined
  })

  it('answers a selector matching several with a unique selector for each', async () => {
    const selectors = [{ index: 0, selector: 'li[data-i="1"]' }, { index: 1, selector: 'li[data-i="2"]' }, { index: 2, selector: 'li[data-i="3"]' }]
    const { session, call } = makeSession({ count: 3 }, { result: { selectors } })

    expect(await resolveAmbiguity(session, frame, '.item')).to.deep.eq({
      ambiguous: true,
      selector: '.item',
      count: 3,
      selectors,
    })

    expect(call).toHaveBeenCalledWith('exec', ['resolve-selector', { selector: '.item' }, {}])
  })

  it('still answers with the count when the instance could derive no selectors', async () => {
    const { session } = makeSession({ count: 2 }, { result: { selectors: [] } })

    expect(await resolveAmbiguity(session, frame, '.item')).to.deep.eq({
      ambiguous: true,
      selector: '.item',
      count: 2,
      selectors: [],
    })
  })

  it('still answers when the instance reports a failure for the selectors', async () => {
    const { session } = makeSession({ count: 2 }, { error: { code: 'NO_AUT', message: 'no app under test is loaded' } })

    expect(await resolveAmbiguity(session, frame, '.item')).to.deep.include({ ambiguous: true, count: 2 })
  })

  it('still answers when asking the instance for selectors throws', async () => {
    const { session } = makeSession({ count: 2 }, new Error('binding gone'))

    expect(await resolveAmbiguity(session, frame, '.item')).to.deep.include({ ambiguous: true, count: 2, selectors: [] })
  })

  it('lets an in-range --at through without asking for selectors', async () => {
    const { session, call } = makeSession({ count: 3 })

    expect(await resolveAmbiguity(session, frame, '.item', 2)).to.be.undefined
    // The caller named which match it wants, so there is nothing to disambiguate.
    expect(call).not.toHaveBeenCalled()
  })

  it('rejects an --at past the last match, naming the valid range', async () => {
    const { session } = makeSession({ count: 3 })

    await expect(resolveAmbiguity(session, frame, '.item', 3)).rejects.toMatchObject({
      code: 'INVALID_VALUE',
      detail: 'Expected `--at` to be 0 to 2, since ".item" matched 3 elements.\n\nInstead the value was: 3',
    })
  })

  it('lets an --at through when the selector matched nothing, leaving the read to report it', async () => {
    const { session } = makeSession({ count: 0 })

    expect(await resolveAmbiguity(session, frame, '.missing', 4)).to.be.undefined
  })

  it('maps a bad selector to the selector it was given', async () => {
    const { session } = makeSession({ invalidSelector: true })

    await expect(resolveAmbiguity(session, frame, '>>bad')).rejects.toMatchObject({
      name: 'TapError',
      code: 'INVALID_VALUE',
      detail: 'Expected `--selector` to be a valid CSS selector.\n\nInstead the value was: ">>bad"',
    })
  })

  it('maps a CDP evaluation exception to FRAME_READ_FAILED', async () => {
    const { session } = makeSession(undefined, undefined, { text: 'boom', exception: { description: 'boom' } })

    await expect(resolveAmbiguity(session, frame, '.item')).rejects.toMatchObject({ code: 'FRAME_READ_FAILED' })
  })
})
