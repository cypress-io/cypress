import { describe, expect, it, vi } from 'vitest'

import { resolveAutFrame, FrameCommandError } from '../../../lib/tap/aut-frame'
import { extractDom } from '../../../lib/tap/frame/dom'
import { extractAria } from '../../../lib/tap/frame/aria'
import { extractInspect } from '../../../lib/tap/frame/inspect'
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

describe('lib/tap/frame/aria extractAria', () => {
  const ax = (nodeId: string, role: string, extra: Record<string, unknown> = {}) => ({
    nodeId,
    role: { value: role },
    ...extra,
  })

  // RootWebArea → (generic, noise) → heading + a disabled textbox with a value.
  const tree = [
    ax('1', 'RootWebArea', { name: { value: 'Login' }, childIds: ['2'] }),
    ax('2', 'generic', { parentId: '1', childIds: ['3', '4'] }),
    ax('3', 'heading', { parentId: '2', name: { value: 'Sign in' } }),
    ax('4', 'textbox', {
      parentId: '2',
      name: { value: 'Username' },
      value: { value: 'ada' },
      backendDOMNodeId: 99,
      properties: [{ name: 'disabled', value: { value: true } }, { name: 'focusable', value: { value: true } }],
    }),
  ]

  const makeAxSession = (opts: { axNodes?: unknown[], selectorObjectId?: string | undefined, selectorSubtype?: string, backendNodeId?: number, throwOnEval?: boolean } = {}) => {
    const callFunctionOn = vi.fn().mockImplementation(async () => {
      if (opts.throwOnEval) {
        return { exceptionDetails: { text: 'bad selector' } }
      }

      return { result: { objectId: opts.selectorObjectId, subtype: opts.selectorSubtype } }
    })

    const client = {
      DOM: {
        enable: vi.fn().mockResolvedValue(undefined),
        describeNode: vi.fn().mockResolvedValue({ node: { backendNodeId: opts.backendNodeId } }),
      },
      Accessibility: {
        enable: vi.fn().mockResolvedValue(undefined),
        getFullAXTree: vi.fn().mockResolvedValue({ nodes: opts.axNodes ?? tree }),
      },
      Page: { createIsolatedWorld: vi.fn().mockResolvedValue({ executionContextId: 7 }) },
      Runtime: { callFunctionOn },
    }

    return { session: { call: vi.fn(), client, sessionId: SESSION_ID } as unknown as TapSession, client }
  }

  const frame = { frameId: 'aut-frame-id', url: 'http://localhost:5555/index.html' }

  it('projects the whole tree, collapsing noise roles and reporting states/value', async () => {
    const { session } = makeAxSession()

    const result = await extractAria(session, frame, undefined, 200)

    expect(result.url).to.eq('http://localhost:5555/index.html')
    expect(result.nodeCount).to.eq(3)
    // The generic node is dropped; the heading and textbox promote under the root.
    expect(result.nodes).to.deep.eq([
      { depth: 0, role: 'RootWebArea', name: 'Login' },
      { depth: 1, role: 'heading', name: 'Sign in' },
      { depth: 1, role: 'textbox', name: 'Username', value: 'ada', states: ['disabled'] },
    ])
  })

  it('roots the tree at the selector match via its backend node id', async () => {
    const { session } = makeAxSession({ selectorObjectId: 'obj-1', backendNodeId: 99 })

    const result = await extractAria(session, frame, '[data-testid=username]', 200)

    expect(result.nodes).to.deep.eq([
      { depth: 0, role: 'textbox', name: 'Username', value: 'ada', states: ['disabled'] },
    ])
  })

  it('returns an empty tree when the selector matches nothing', async () => {
    const { session } = makeAxSession({ selectorObjectId: undefined, selectorSubtype: 'null' })

    const result = await extractAria(session, frame, '.missing', 200)

    expect(result).to.deep.eq({ url: 'http://localhost:5555/index.html', nodes: [], nodeCount: 0 })
  })

  it('maps a bad selector to INVALID_SELECTOR', async () => {
    const { session } = makeAxSession({ throwOnEval: true })

    await expect(extractAria(session, frame, '>>bad', 200)).rejects.toMatchObject({ code: 'INVALID_SELECTOR' })
  })

  it('caps the tree at max-nodes and flags truncation', async () => {
    const { session } = makeAxSession()

    const result = await extractAria(session, frame, undefined, 2)

    expect(result.nodeCount).to.eq(2)
    expect(result.truncated).to.eq(true)
  })
})

describe('lib/tap/frame/inspect extractInspect', () => {
  const frame = { frameId: 'aut-frame-id', url: 'http://localhost:5555/index.html' }

  const ELEMENT_INFO = {
    tag: 'input',
    attributes: { 'data-testid': 'username-input', name: 'username' },
    styles: { display: 'block', color: 'rgb(0, 0, 0)', 'font-size': '16px' },
    box: { x: 8, y: 40, width: 200, height: 30 },
  }

  const makeInspectSession = (opts: {
    selectorObjectId?: string
    selectorSubtype?: string
    throwOnEval?: boolean
    elementInfo?: unknown
    axThrows?: boolean
    axNodes?: unknown[]
  } = {}) => {
    // callFunctionOn is used twice: first to querySelector (returns the element
    // objectId), then to read the element's info by value.
    const callFunctionOn = vi.fn()
    .mockImplementationOnce(async () => {
      if (opts.throwOnEval) {
        return { exceptionDetails: { text: 'bad selector' } }
      }

      return { result: { objectId: opts.selectorObjectId, subtype: opts.selectorSubtype } }
    })
    .mockImplementationOnce(async () => ({ result: { value: opts.elementInfo ?? ELEMENT_INFO } }))

    const getPartialAXTree = vi.fn().mockImplementation(async () => {
      if (opts.axThrows) {
        throw new Error('no ax')
      }

      return { nodes: opts.axNodes ?? [{ role: { value: 'textbox' }, name: { value: 'Username' }, backendDOMNodeId: 40, properties: [{ name: 'disabled', value: { value: true } }] }] }
    })

    const client = {
      DOM: {
        enable: vi.fn().mockResolvedValue(undefined),
        describeNode: vi.fn().mockResolvedValue({ node: { backendNodeId: 40 } }),
      },
      Accessibility: {
        enable: vi.fn().mockResolvedValue(undefined),
        getPartialAXTree,
      },
      Page: { createIsolatedWorld: vi.fn().mockResolvedValue({ executionContextId: 7 }) },
      Runtime: { callFunctionOn },
    }

    return { session: { call: vi.fn(), client, sessionId: SESSION_ID } as unknown as TapSession }
  }

  it('returns tag, attributes, curated styles, box, and the ax node for a match', async () => {
    const { session } = makeInspectSession({ selectorObjectId: 'obj-1' })

    const result = await extractInspect(session, frame, '[data-testid=username-input]')

    expect(result.found).to.eq(true)
    expect(result.tag).to.eq('input')
    expect(result.attributes).to.deep.eq({ 'data-testid': 'username-input', name: 'username' })
    expect(result.box).to.deep.eq({ x: 8, y: 40, width: 200, height: 30 })
    expect(result.styles).to.deep.eq({ display: 'block', color: 'rgb(0, 0, 0)', 'font-size': '16px' })
    expect(result.aria).to.deep.eq({ role: 'textbox', name: 'Username', states: ['disabled'] })
  })

  it('returns found:false when the selector matches nothing', async () => {
    const { session } = makeInspectSession({ selectorObjectId: undefined, selectorSubtype: 'null' })

    const result = await extractInspect(session, frame, '.missing')

    expect(result).to.deep.eq({ url: 'http://localhost:5555/index.html', selector: '.missing', found: false })
  })

  it('maps a bad selector to INVALID_SELECTOR', async () => {
    const { session } = makeInspectSession({ throwOnEval: true })

    await expect(extractInspect(session, frame, '>>bad')).rejects.toMatchObject({ code: 'INVALID_SELECTOR' })
  })

  it('still returns the element when the accessibility node is unavailable', async () => {
    const { session } = makeInspectSession({ selectorObjectId: 'obj-1', axThrows: true })

    const result = await extractInspect(session, frame, '.plain')

    expect(result.found).to.eq(true)
    expect(result.aria).to.be.undefined
    expect(result.tag).to.eq('input')
  })
})
