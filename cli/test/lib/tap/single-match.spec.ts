import { describe, expect, it, vi } from 'vitest'

import { resolveAmbiguity } from '../../../lib/tap/aut/single-match'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

describe('lib/tap/aut/single-match resolveAmbiguity', () => {
  const frame = { frameId: 'aut-frame-id' }

  const makeSession = (count: unknown, exceptionDetails?: unknown) => {
    const createIsolatedWorld = vi.fn().mockResolvedValue({ executionContextId: 42 })
    const callFunctionOn = vi.fn().mockResolvedValue({ result: { value: count }, exceptionDetails })

    const session = {
      client: { Page: { createIsolatedWorld }, Runtime: { callFunctionOn } },
      sessionId: SESSION_ID,
    } as unknown as TapSession

    return { session, callFunctionOn, createIsolatedWorld }
  }

  it('lets a selector matching exactly one element through, counting it in the AUT frame', async () => {
    const { session, callFunctionOn, createIsolatedWorld } = makeSession({ count: 1 })

    expect(await resolveAmbiguity(session, frame, '.one')).to.be.undefined

    expect(createIsolatedWorld).toHaveBeenCalledWith({ frameId: 'aut-frame-id', worldName: 'cypress-tap' }, SESSION_ID)
    expect(callFunctionOn.mock.calls[0][0]).toMatchObject({
      executionContextId: 42,
      arguments: [{ value: '.one' }],
      returnByValue: true,
    })
  })

  it('lets a selector matching nothing through — each command reports that in its own shape', async () => {
    const { session } = makeSession({ count: 0 })

    expect(await resolveAmbiguity(session, frame, '.missing')).to.be.undefined
  })

  it('answers a selector matching several with how many it matched', async () => {
    const { session } = makeSession({ count: 3 })

    expect(await resolveAmbiguity(session, frame, '.item')).to.deep.eq({
      ambiguous: true,
      selector: '.item',
      count: 3,
    })
  })

  it('lets an in-range --at through', async () => {
    const { session } = makeSession({ count: 3 })

    expect(await resolveAmbiguity(session, frame, '.item', 2)).to.be.undefined
  })

  it('rejects an --at past the last match, naming the valid range', async () => {
    const { session } = makeSession({ count: 3 })

    await expect(resolveAmbiguity(session, frame, '.item', 3)).rejects.toMatchObject({
      code: 'INVALID_INDEX',
      message: '".item" matched 3 elements; pass --at 0-2',
    })
  })

  it('rejects an --at when nothing is there to index', async () => {
    const { session, callFunctionOn } = makeSession({ count: 1 })

    await expect(resolveAmbiguity(session, frame, undefined, 0)).rejects.toMatchObject({ code: 'INVALID_INDEX' })
    // No selector means no reason to reach into the frame at all.
    expect(callFunctionOn).not.toHaveBeenCalled()
  })

  it('lets an --at through when the selector matched nothing, leaving the read to report it', async () => {
    const { session } = makeSession({ count: 0 })

    expect(await resolveAmbiguity(session, frame, '.missing', 4)).to.be.undefined
  })

  it('maps a bad selector to INVALID_SELECTOR', async () => {
    const { session } = makeSession({ invalidSelector: true })

    await expect(resolveAmbiguity(session, frame, '>>bad')).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'INVALID_SELECTOR',
    })
  })

  it('maps a CDP evaluation exception to FRAME_READ_FAILED', async () => {
    const { session } = makeSession(undefined, { text: 'boom', exception: { description: 'boom' } })

    await expect(resolveAmbiguity(session, frame, '.item')).rejects.toMatchObject({ code: 'FRAME_READ_FAILED' })
  })
})
