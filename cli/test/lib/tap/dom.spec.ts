import { describe, expect, it, vi } from 'vitest'

import { extractDom } from '../../../lib/tap/commands/dom'
import { TapError } from '@packages/cypress-sessions'
import type { TapConnection } from '../../../lib/tap/tap-connection'

const SESSION_ID = 'S1'

// In selector mode the single-element guard counts matches first, so a connection
// serves its responses in order: the count, then the read.
const MATCHED_ONE = { value: { count: 1 } }

describe('lib/tap/commands/dom extractDom', () => {
  const makeSession = (responses: Array<{ value?: unknown, exceptionDetails?: unknown }>) => {
    const createIsolatedWorld = vi.fn().mockResolvedValue({ executionContextId: 42 })
    const callFunctionOn = vi.fn()

    for (const { value, exceptionDetails } of responses) {
      callFunctionOn.mockResolvedValueOnce({ result: { value }, exceptionDetails })
    }

    const connection = {
      call: vi.fn(),
      client: { Page: { createIsolatedWorld }, Runtime: { callFunctionOn } },
      sessionId: SESSION_ID,
    } as unknown as TapConnection

    return { connection, createIsolatedWorld, callFunctionOn }
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

  it('returns the matched element, forwarding the selector and maxChars', async () => {
    const { connection, createIsolatedWorld, callFunctionOn } = makeSession([MATCHED_ONE, { value: { found: true, html: '<a></a>' } }])

    const result = await extractDom(connection, frame, '.x', 100)

    expect(result).to.deep.eq({ found: true, html: '<a></a>' })
    // Isolated world is created for the resolved AUT frame, on its connection.
    expect(createIsolatedWorld).toHaveBeenCalledWith({ frameId: 'aut-frame-id', worldName: 'cypress-tap' }, SESSION_ID)
    expect(callFunctionOn.mock.calls[1][0]).toMatchObject({
      executionContextId: 42,
      arguments: [{ value: '.x' }, { value: 100 }, { value: 0 }],
      returnByValue: true,
    })

    expect(callFunctionOn.mock.calls[1][1]).to.eq(SESSION_ID)
  })

  it('returns found:false when the selector matches nothing', async () => {
    const { connection } = makeSession([{ value: { count: 0 } }, { value: { found: false } }])

    const result = await extractDom(connection, frame, '.missing', 100)

    expect(result).to.deep.eq({ found: false })
  })

  it('answers a selector matching more than one element instead of reading', async () => {
    const { connection, callFunctionOn } = makeSession([{ value: { count: 3 } }])

    expect(await extractDom(connection, frame, '.x', 100)).to.deep.include({ ambiguous: true, selector: '.x', count: 3 })
    // The read itself never runs — the count is the only call.
    expect(callFunctionOn).toHaveBeenCalledTimes(1)
  })

  it('reads the match --at names instead of answering with the list', async () => {
    const { connection, callFunctionOn } = makeSession([{ value: { count: 3 } }, { value: { found: true, html: '<c></c>' } }])

    const result = await readDom(connection, frame, '.x', 100, 2)

    expect(result).to.deep.eq({ found: true, html: '<c></c>' })
    expect(callFunctionOn.mock.calls[1][0].arguments).to.deep.eq([{ value: '.x' }, { value: 100 }, { value: 2 }])
  })

  it('reports truncation from the browser-side cap', async () => {
    const { connection } = makeSession([MATCHED_ONE, { value: { found: true, html: '<htm', truncated: true } }])

    const result = await readDom(connection, frame, '.x', 4)

    expect(result.truncated).to.eq(true)
    expect(result.html).to.eq('<htm')
  })

  it('reports a rejected selector as the value it was given', async () => {
    const { connection } = makeSession([{ value: { invalidSelector: true } }])

    await expect(extractDom(connection, frame, '>>bad', 100)).rejects.toMatchObject({
      name: 'TapError',
      code: 'INVALID_VALUE',
      detail: 'Expected `--selector` to be a valid CSS selector.\n\nInstead the value was: ">>bad"',
    })
  })

  it('maps a CDP evaluation exception to FRAME_READ_FAILED', async () => {
    const failing = () => makeSession([MATCHED_ONE, { exceptionDetails: { text: 'boom', exception: { description: 'boom' } } }]).connection

    await expect(extractDom(failing(), frame, '.x', 100)).rejects.toBeInstanceOf(TapError)
    await expect(extractDom(failing(), frame, '.x', 100)).rejects.toMatchObject({ code: 'FRAME_READ_FAILED' })
  })
})
