import { describe, expect, it, vi } from 'vitest'

import { resolveAutFrame, assertFrameReadable, parsePositiveInt, FrameCommandError } from '../../../lib/tap/aut/frame'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

// A frame tree matching the real runner page: the AUT child frame plus the
// snapshot double-buffers and the spec bridge, which the resolver must ignore.
const frameTree = (autUrl = 'http://localhost:5555/index.html') => {
  return {
    frame: { id: 'top', name: '', url: 'http://localhost:5555/__/' },
    childFrames: [
      { frame: { id: 'aut-frame-id', name: 'Your project: \'Test Project\'', url: autUrl } },
      { frame: { id: 'snap-0', name: 'AUT Snapshot - 0: \'Test Project\'', url: 'about:blank' } },
      { frame: { id: 'spec', name: 'Your Spec: \'/…/login.cy.js\'', url: 'http://localhost:5555/__cypress/iframes/x' } },
    ],
  }
}

const makePageClient = (tree: ReturnType<typeof frameTree>) => {
  return {
    Page: {
      enable: vi.fn().mockResolvedValue(undefined),
      getFrameTree: vi.fn().mockResolvedValue({ frameTree: tree }),
    },
  }
}

describe('lib/tap/aut/frame resolveAutFrame', () => {
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

describe('lib/tap/aut/frame assertFrameReadable', () => {
  const sessionForRunState = (envelope: unknown) => {
    return { call: vi.fn().mockResolvedValue(envelope) } as unknown as TapSession
  }

  it('resolves once the run has settled to passed', async () => {
    const session = sessionForRunState({ result: { spec: 'login.cy.js', totalSpecs: 1, state: 'passed' } })

    await expect(assertFrameReadable(session)).resolves.toBeUndefined()
    // Gated on the run-state the status command also reads.
    expect(session.call).toHaveBeenCalledWith('exec', ['run-state', {}, {}])
  })

  it('resolves once the run has settled to failed', async () => {
    const session = sessionForRunState({ result: { spec: 'login.cy.js', totalSpecs: 1, state: 'failed' } })

    await expect(assertFrameReadable(session)).resolves.toBeUndefined()
  })

  it('rejects mid-run with RUN_IN_PROGRESS so a poller waits for the app to settle', async () => {
    const session = sessionForRunState({ result: { spec: 'login.cy.js', totalSpecs: 1, state: 'running' } })

    await expect(assertFrameReadable(session)).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'RUN_IN_PROGRESS',
    })
  })

  it('rejects with NO_RUN — distinct from mid-run — when no spec has run', async () => {
    const session = sessionForRunState({ result: { spec: null, totalSpecs: 3 } })

    await expect(assertFrameReadable(session)).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'NO_RUN',
    })
  })

  it('surfaces an app-side run-state error envelope as a FrameCommandError', async () => {
    const session = sessionForRunState({ error: { code: 'BOOM', message: 'run-state blew up' } })

    await expect(assertFrameReadable(session)).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'BOOM',
      message: 'run-state blew up',
    })
  })
})

describe('lib/tap/aut/frame parsePositiveInt', () => {
  it('falls back when the value is absent', () => {
    expect(parsePositiveInt(undefined, 200, 'max-nodes')).to.eq(200)
  })

  it('parses a positive integer', () => {
    expect(parsePositiveInt('50', 200, 'max-nodes')).to.eq(50)
  })

  it('rejects zero, negatives, and non-integers with INVALID_LIMIT', () => {
    for (const bad of ['0', '-5', '1.5', 'abc']) {
      expect(() => parsePositiveInt(bad, 200, 'max-nodes')).to.throw(FrameCommandError).that.includes({ code: 'INVALID_LIMIT' })
    }
  })
})
