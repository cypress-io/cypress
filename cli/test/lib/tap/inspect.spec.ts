import { describe, expect, it, vi } from 'vitest'

import { extractInspect } from '../../../lib/tap/commands/inspect'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

describe('lib/tap/commands/inspect extractInspect', () => {
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
