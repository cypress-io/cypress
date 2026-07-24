import { describe, expect, it, vi } from 'vitest'

import { extractDom } from '../../../lib/tap/commands/dom'
import { FrameCommandError } from '../../../lib/tap/aut/frame'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

describe('lib/tap/commands/dom extractDom', () => {
  const makeSession = (fnValue: unknown, exceptionDetails?: unknown) => {
    const createIsolatedWorld = vi.fn().mockResolvedValue({ executionContextId: 42 })
    const callFunctionOn = vi.fn().mockResolvedValue({ result: { value: fnValue }, exceptionDetails })

    const session = {
      call: vi.fn(),
      client: { Page: { createIsolatedWorld }, Runtime: { callFunctionOn } },
      sessionId: SESSION_ID,
    } as unknown as TapSession

    return { session, createIsolatedWorld, callFunctionOn }
  }

  const frame = { frameId: 'aut-frame-id', url: 'http://localhost:5555/index.html' }

  it('returns the whole-document HTML with the frame url when no selector is given', async () => {
    const { session, createIsolatedWorld, callFunctionOn } = makeSession({ html: '<html>hi</html>' })

    const result = await extractDom(session, frame, undefined, 30000)

    expect(result).to.deep.eq({ url: 'http://localhost:5555/index.html', html: '<html>hi</html>' })
    // Isolated world is created for the resolved AUT frame, on its session.
    expect(createIsolatedWorld).toHaveBeenCalledWith({ frameId: 'aut-frame-id', worldName: 'cypress-tap' }, SESSION_ID)
    // selector (null when absent) and maxChars are forwarded as call arguments.
    expect(callFunctionOn.mock.calls[0][0]).toMatchObject({
      executionContextId: 42,
      arguments: [{ value: null }, { value: 30000 }],
      returnByValue: true,
    })

    expect(callFunctionOn.mock.calls[0][1]).to.eq(SESSION_ID)
  })

  it('returns matches (and forwards the selector) in selector mode', async () => {
    const { session, callFunctionOn } = makeSession({ matches: { count: 2, html: ['<a>', '<b>'] }, truncated: false })

    const result = await extractDom(session, frame, '.x', 100)

    expect(result.matches).to.deep.eq({ count: 2, html: ['<a>', '<b>'] })
    expect(result.html).to.be.undefined
    expect(callFunctionOn.mock.calls[0][0].arguments).to.deep.eq([{ value: '.x' }, { value: 100 }])
  })

  it('reports truncation from the browser-side cap', async () => {
    const { session } = makeSession({ html: '<htm', truncated: true })

    const result = await extractDom(session, frame, undefined, 4)

    expect(result.truncated).to.eq(true)
    expect(result.html).to.eq('<htm')
  })

  it('maps a bad selector to INVALID_SELECTOR', async () => {
    const { session } = makeSession({ invalidSelector: true })

    await expect(extractDom(session, frame, '>>bad', 100)).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'INVALID_SELECTOR',
    })
  })

  it('maps a CDP evaluation exception to FRAME_READ_FAILED', async () => {
    const { session } = makeSession(undefined, { text: 'boom', exception: { description: 'boom' } })

    await expect(extractDom(session, frame, undefined, 100)).rejects.toBeInstanceOf(FrameCommandError)
    await expect(extractDom(session, frame, undefined, 100)).rejects.toMatchObject({ code: 'FRAME_READ_FAILED' })
  })
})
