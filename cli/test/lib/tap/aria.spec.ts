import { describe, expect, it, vi } from 'vitest'

import { extractAria } from '../../../lib/tap/commands/aria'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

describe('lib/tap/commands/aria extractAria', () => {
  const ax = (nodeId: string, role: string, extra: Record<string, unknown> = {}) => {
    return {
      nodeId,
      role: { value: role },
      ...extra,
    }
  }

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
