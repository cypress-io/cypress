import { beforeEach, describe, expect, it, vi } from 'vitest'
import stripAnsi from 'strip-ansi'

import logger from '../../../lib/logger'
import { resolveInstance } from '../../../lib/cypress-instances'
import { withTapSession } from '../../../lib/tap/tap-session'
import { resolveAutFrame, assertFrameReadable, withResolvedAutFrame } from '../../../lib/tap/aut/frame'
import type { TapSession } from '../../../lib/tap/tap-session'
import type { TapCliOptions } from '../../../lib/tap/types'

vi.mock('../../../lib/cypress-instances', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/cypress-instances')>()

  return { ...actual, resolveInstance: vi.fn() }
})

vi.mock('../../../lib/tap/tap-session', async (importActual) => {
  const actual = await importActual<typeof import('../../../lib/tap/tap-session')>()

  return { ...actual, withTapSession: vi.fn() }
})

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

    expect(frame).to.deep.eq({ frameId: 'aut-frame-id' })
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
      message: 'a spec is currently running — call `cypress tap status` to check its current status; wait for it to finish before trying again',
    })
  })

  it('rejects with NO_RUN — distinct from mid-run — when no spec has run', async () => {
    const session = sessionForRunState({ result: { spec: null, totalSpecs: 3 } })

    await expect(assertFrameReadable(session)).rejects.toMatchObject({
      name: 'FrameCommandError',
      code: 'NO_RUN',
    })
  })

  it('rejects a spec still building with NO_RUN — loading is not a verdict, so there is no run to read', async () => {
    const session = sessionForRunState({ result: { spec: 'login.cy.js', totalSpecs: 1, state: 'loading', startedAt: null } })

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

describe('lib/tap/aut/frame withResolvedAutFrame', () => {
  const stdout = (): string => vi.mocked(console.log).mock.calls.flat().join(' ')
  const stderr = (): string => vi.mocked(console.error).mock.calls.flat().join(' ')

  beforeEach(() => {
    const session = {
      call: vi.fn().mockResolvedValue({ result: { spec: 'login.cy.js', totalSpecs: 1, state: 'passed' } }),
      client: makePageClient(frameTree()),
      sessionId: SESSION_ID,
    } as unknown as TapSession

    vi.mocked(resolveInstance).mockResolvedValue({ instance: {}, reason: 'only', candidateCount: 1 } as any)
    vi.mocked(withTapSession).mockImplementation((_instance: any, use: any) => use(session))

    logger.reset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const read = async (result: unknown, options: TapCliOptions = { json: true } as TapCliOptions): Promise<number> => {
    return withResolvedAutFrame(options, async () => result, 'dom')
  }

  it('prints the read and exits 0', async () => {
    expect(await read({ found: true, html: '<p>hi</p>' })).to.eq(0)
    expect(stdout()).toContain('"html": "<p>hi</p>"')
  })

  it('exits 1 on an ambiguous selector — the read that was asked for did not happen', async () => {
    expect(await read({ ambiguous: true, selector: '.item', count: 2 })).to.eq(1)
  })

  it('still prints the ambiguity answer as a result, so the matches to choose between survive the non-zero exit', async () => {
    await read({ ambiguous: true, selector: '.item', count: 2 })

    expect(JSON.parse(stdout())).to.deep.eq({ ambiguous: true, selector: '.item', count: 2 })
    expect(stderr()).to.eq('')
  })

  it('renders the ambiguity for a human on stdout too, exiting 1 all the same', async () => {
    expect(await read({ ambiguous: true, selector: '.item', count: 2 }, {} as TapCliOptions)).to.eq(1)

    expect(stripAnsi(stdout())).toContain('matched 2 elements but must be unique')
    expect(stderr()).to.eq('')
  })
})
