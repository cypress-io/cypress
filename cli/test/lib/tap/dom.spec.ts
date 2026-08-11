import { describe, expect, it, vi } from 'vitest'

import { extractDom } from '../../../lib/tap/commands/dom'
import { TapError } from '@packages/cypress-instances'
import type { TapSession } from '../../../lib/tap/tap-session'

const SESSION_ID = 'S1'

// In selector mode the single-element guard counts matches first, so a session
// serves its responses in order: the count, then the read.
const MATCHED_ONE = { value: { count: 1 } }

describe('lib/tap/commands/dom extractDom', () => {
  const makeSession = (responses: Array<{ value?: unknown, exceptionDetails?: unknown }>) => {
    const createIsolatedWorld = vi.fn().mockResolvedValue({ executionContextId: 42 })
    const callFunctionOn = vi.fn()

    for (const { value, exceptionDetails } of responses) {
      callFunctionOn.mockResolvedValueOnce({ result: { value }, exceptionDetails })
    }

    const session = {
      call: vi.fn(),
      client: { Page: { createIsolatedWorld }, Runtime: { callFunctionOn } },
      sessionId: SESSION_ID,
    } as unknown as TapSession

    return { session, createIsolatedWorld, callFunctionOn }
  }

  const frame = { frameId: 'aut-frame-id' }

  // A read returns HTML; an ambiguous selector returns the candidates instead,
  // which only the dedicated test below expects.
  const readDom = async (...args: Parameters<typeof extractDom>) => {
    const result = await extractDom(...args)

    if ('ambiguous' in result) {
      throw new Error(`expected a read, got the ambiguity answer: ${JSON.stringify(result)}`)
    }

    return result
  }

  it('returns the whole-document HTML when no selector is given', async () => {
    const { session, createIsolatedWorld, callFunctionOn } = makeSession([{ value: { html: '<html>hi</html>' } }])

    const result = await extractDom(session, frame, undefined, 30000)

    expect(result).to.deep.eq({ html: '<html>hi</html>' })
    // Isolated world is created for the resolved AUT frame, on its session.
    expect(createIsolatedWorld).toHaveBeenCalledWith({ frameId: 'aut-frame-id', worldName: 'cypress-tap' }, SESSION_ID)
    // selector (null when absent) and maxChars are forwarded as call arguments.
    expect(callFunctionOn.mock.calls[0][0]).toMatchObject({
      executionContextId: 42,
      arguments: [{ value: null }, { value: 30000 }, { value: 0 }],
      returnByValue: true,
    })

    expect(callFunctionOn.mock.calls[0][1]).to.eq(SESSION_ID)
  })

  it('returns the matched element (and forwards the selector) in selector mode', async () => {
    const { session, callFunctionOn } = makeSession([MATCHED_ONE, { value: { found: true, html: '<a></a>' } }])

    const result = await extractDom(session, frame, '.x', 100)

    expect(result).to.deep.eq({ found: true, html: '<a></a>' })
    expect(callFunctionOn.mock.calls[1][0].arguments).to.deep.eq([{ value: '.x' }, { value: 100 }, { value: 0 }])
  })

  it('returns found:false when the selector matches nothing', async () => {
    const { session } = makeSession([{ value: { count: 0 } }, { value: { found: false } }])

    const result = await extractDom(session, frame, '.missing', 100)

    expect(result).to.deep.eq({ found: false })
  })

  it('answers a selector matching more than one element instead of reading', async () => {
    const { session, callFunctionOn } = makeSession([{ value: { count: 3 } }])

    expect(await extractDom(session, frame, '.x', 100)).to.deep.include({ ambiguous: true, selector: '.x', count: 3 })
    // The read itself never runs — the count is the only call.
    expect(callFunctionOn).toHaveBeenCalledTimes(1)
  })

  it('reads the match --at names instead of answering with the list', async () => {
    const { session, callFunctionOn } = makeSession([{ value: { count: 3 } }, { value: { found: true, html: '<c></c>' } }])

    const result = await readDom(session, frame, '.x', 100, 2)

    expect(result).to.deep.eq({ found: true, html: '<c></c>' })
    expect(callFunctionOn.mock.calls[1][0].arguments).to.deep.eq([{ value: '.x' }, { value: 100 }, { value: 2 }])
  })

  it('reports truncation from the browser-side cap', async () => {
    const { session } = makeSession([{ value: { html: '<htm', truncated: true } }])

    const result = await readDom(session, frame, undefined, 4)

    expect(result.truncated).to.eq(true)
    expect(result.html).to.eq('<htm')
  })

  it('maps a bad selector to INVALID_SELECTOR', async () => {
    const { session } = makeSession([{ value: { invalidSelector: true } }])

    await expect(extractDom(session, frame, '>>bad', 100)).rejects.toMatchObject({
      name: 'TapError',
      code: 'INVALID_SELECTOR',
    })
  })

  it('maps a CDP evaluation exception to FRAME_READ_FAILED', async () => {
    const failing = () => makeSession([{ exceptionDetails: { text: 'boom', exception: { description: 'boom' } } }]).session

    await expect(extractDom(failing(), frame, undefined, 100)).rejects.toBeInstanceOf(TapError)
    await expect(extractDom(failing(), frame, undefined, 100)).rejects.toMatchObject({ code: 'FRAME_READ_FAILED' })
  })
})
