import { describe, expect, it, vi } from 'vitest'

import { resolveAutFrame, FrameCommandError } from '../../../lib/tap/aut-frame'
import { extractDom } from '../../../lib/tap/frame/dom'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

// A frame tree matching the real runner page: the AUT child frame plus the
// snapshot double-buffers and the spec bridge, which the resolver must ignore.
const frameTree = (autUrl = 'http://localhost:5555/index.html') => ({
  frame: { id: 'top', name: '', url: 'http://localhost:5555/__/' },
  childFrames: [
    { frame: { id: 'aut-frame-id', name: 'Your project: \'Test Project\'', url: autUrl } },
    { frame: { id: 'snap-0', name: 'AUT Snapshot - 0: \'Test Project\'', url: 'about:blank' } },
    { frame: { id: 'spec', name: 'Your Spec: \'/…/login.cy.js\'', url: 'http://localhost:5555/__cypress/iframes/x' } },
  ],
})

const makePageClient = (tree: ReturnType<typeof frameTree>) => {
  return {
    Page: {
      enable: vi.fn().mockResolvedValue(undefined),
      getFrameTree: vi.fn().mockResolvedValue({ frameTree: tree }),
    },
  }
}

describe('lib/tap/aut-frame resolveAutFrame', () => {
  it('resolves the AUT child frame by its name prefix, ignoring snapshot buffers and the spec bridge', async () => {
    const client = makePageClient(frameTree())

    const frame = await resolveAutFrame(client as any, SESSION_ID)

    expect(frame).to.deep.eq({ frameId: 'aut-frame-id', url: 'http://localhost:5555/index.html' })
    // getFrameTree takes no params — CRI routes the session id by type.
    expect(client.Page.getFrameTree).toHaveBeenCalledWith(SESSION_ID)
  })

  it('throws NO_AUT_FRAME when no frame matches (no spec loaded yet)', async () => {
    const client = makePageClient({
      frame: { id: 'top', name: '', url: 'http://localhost:5555/__/' },
      childFrames: [{ frame: { id: 'snap-0', name: 'AUT Snapshot - 0: \'x\'', url: 'about:blank' } }],
    })

    await expect(resolveAutFrame(client as any, SESSION_ID)).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'NO_AUT_FRAME',
    })
  })
})

describe('lib/tap/frame/dom extractDom', () => {
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
