import { describe, expect, it, vi } from 'vitest'

import { TapError } from '../../../lib/cypress-instances'
import { extractInspect } from '../../../lib/tap/commands/inspect'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

describe('lib/tap/commands/inspect extractInspect', () => {
  const frame = { frameId: 'aut-frame-id' }

  const ELEMENT_INFO = {
    tag: 'input',
    attributes: { 'data-testid': 'username-input', name: 'username' },
    styles: { display: 'block', color: 'rgb(0, 0, 0)', 'font-size': '16px' },
    box: { x: 8, y: 40, width: 200, height: 30 },
  }

  const makeInspectSession = (opts: {
    selectorObjectId?: string
    selectorSubtype?: string
    matchCount?: number
    invalidSelector?: boolean
    elementInfo?: unknown
    axError?: unknown
    axNodes?: unknown[]
  } = {}) => {
    // callFunctionOn is used three times: the single-element guard's match count,
    // then querySelector (returns the element objectId), then the element's info
    // by value.
    const callFunctionOn = vi.fn()
    .mockImplementationOnce(async () => ({ result: { value: opts.invalidSelector ? { invalidSelector: true } : { count: opts.matchCount ?? 1 } } }))
    .mockImplementationOnce(async () => ({ result: { objectId: opts.selectorObjectId, subtype: opts.selectorSubtype } }))
    .mockImplementationOnce(async () => ({ result: { value: opts.elementInfo ?? ELEMENT_INFO } }))

    const getPartialAXTree = vi.fn().mockImplementation(async () => {
      if (opts.axError) {
        throw opts.axError
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

  // A read returns the element; an ambiguous selector returns the candidates
  // instead, which only the dedicated test below expects.
  const readInspect = async (...args: Parameters<typeof extractInspect>) => {
    const result = await extractInspect(...args)

    if ('ambiguous' in result) {
      throw new Error(`expected a read, got the ambiguity answer: ${JSON.stringify(result)}`)
    }

    return result
  }

  it('returns tag, attributes, curated styles, box, and the ax node for a match', async () => {
    const { session } = makeInspectSession({ selectorObjectId: 'obj-1' })

    const result = await readInspect(session, frame, '[data-testid=username-input]')

    expect(result.found).to.eq(true)
    expect(result.tag).to.eq('input')
    expect(result.attributes).to.deep.eq({ 'data-testid': 'username-input', name: 'username' })
    expect(result.box).to.deep.eq({ x: 8, y: 40, width: 200, height: 30 })
    expect(result.styles).to.deep.eq({ display: 'block', color: 'rgb(0, 0, 0)', 'font-size': '16px' })
    expect(result.aria).to.deep.eq({ role: 'textbox', name: 'Username', states: ['disabled'] })
  })

  it('returns found:false when the selector matches nothing', async () => {
    const { session } = makeInspectSession({ matchCount: 0, selectorObjectId: undefined, selectorSubtype: 'null' })

    const result = await extractInspect(session, frame, '.missing')

    expect(result).to.deep.eq({ selector: '.missing', found: false })
  })

  it('answers a selector matching more than one element instead of reading', async () => {
    const { session } = makeInspectSession({ matchCount: 4 })

    expect(await extractInspect(session, frame, '.item')).to.deep.eq({
      ambiguous: true,
      selector: '.item',
      count: 4,
      selectors: [],
    })
  })

  it('reports a rejected selector as the value it was given', async () => {
    const { session } = makeInspectSession({ invalidSelector: true })

    await expect(extractInspect(session, frame, '>>bad')).rejects.toMatchObject({ code: 'INVALID_VALUE' })
  })

  it('still returns the element when the accessibility node is unavailable', async () => {
    const { session } = makeInspectSession({ selectorObjectId: 'obj-1', axError: new Error('no ax') })

    const result = await readInspect(session, frame, '.plain')

    expect(result.found).to.eq(true)
    expect(result.aria).to.be.undefined
    expect(result.tag).to.eq('input')
  })

  it('fails instead of reporting a partial element when the renderer stops answering', async () => {
    const { session } = makeInspectSession({
      selectorObjectId: 'obj-1',
      axError: new TapError('RENDERER_UNRESPONSIVE', { detail: 'The targeted Cypress instance did not answer Accessibility.getPartialAXTree within 30000ms.' }),
    })

    await expect(extractInspect(session, frame, '.wedged')).rejects.toMatchObject({ code: 'RENDERER_UNRESPONSIVE' })
  })
})
