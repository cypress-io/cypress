import { describe, expect, it, vi } from 'vitest'

import { extractAria } from '../../../lib/tap/commands/aria'
import type { TapConnection } from '../../../lib/tap/tap-connection'

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
    ax('1', 'RootWebArea', { name: { value: 'Login' }, childIds: ['2'], backendDOMNodeId: 1 }),
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

  const makeAxSession = (opts: { axNodes?: unknown[], selectorObjectId?: string | undefined, selectorSubtype?: string, backendNodeId?: number, matchCount?: number, invalidSelector?: boolean } = {}) => {
    // In selector mode the single-element guard counts matches first; the
    // selector is only resolved to an element once it matched exactly one.
    const callFunctionOn = vi.fn()
    .mockImplementationOnce(async () => {
      return { result: { value: opts.invalidSelector ? { invalidSelector: true } : { count: opts.matchCount ?? 1 } } }
    })
    .mockImplementation(async () => {
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

    return { session: { call: vi.fn(), client, sessionId: SESSION_ID } as unknown as TapConnection, client }
  }

  const frame = { frameId: 'aut-frame-id' }

  // A read returns the tree; an ambiguous selector returns the candidates
  // instead, which only the dedicated test below expects.
  const readAria = async (...args: Parameters<typeof extractAria>) => {
    const result = await extractAria(...args)

    if ('ambiguous' in result) {
      throw new Error(`expected a tree, got the ambiguity answer: ${JSON.stringify(result)}`)
    }

    return result
  }

  it('projects the whole tree, collapsing noise roles and reporting states/value', async () => {
    const { session } = makeAxSession({ selectorObjectId: 'obj-root', backendNodeId: 1 })

    const result = await readAria(session, frame, 'body', 200)

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

    const result = await readAria(session, frame, '[data-testid=username]', 200)

    expect(result.nodes).to.deep.eq([
      { depth: 0, role: 'textbox', name: 'Username', value: 'ada', states: ['disabled'] },
    ])
  })

  it('returns an empty tree when the selector matches nothing', async () => {
    const { session } = makeAxSession({ matchCount: 0, selectorObjectId: undefined, selectorSubtype: 'null' })

    const result = await readAria(session, frame, '.missing', 200)

    expect(result).to.deep.eq({ nodes: [], nodeCount: 0 })
  })

  it('answers a selector matching more than one element without fetching the tree', async () => {
    const { session, client } = makeAxSession({ matchCount: 2 })

    expect(await extractAria(session, frame, '.item', 200)).to.deep.include({ ambiguous: true, selector: '.item', count: 2 })
    expect(client.Accessibility.getFullAXTree).not.toHaveBeenCalled()
  })

  it('reports a rejected selector as the value it was given', async () => {
    const { session } = makeAxSession({ invalidSelector: true })

    await expect(extractAria(session, frame, '>>bad', 200)).rejects.toMatchObject({ code: 'INVALID_VALUE' })
  })

  it('caps the tree at max-nodes and flags truncation', async () => {
    const { session } = makeAxSession({ selectorObjectId: 'obj-root', backendNodeId: 1 })

    const result = await readAria(session, frame, 'body', 2)

    expect(result.nodeCount).to.eq(2)
    expect(result.truncated).to.eq(true)
  })
})
