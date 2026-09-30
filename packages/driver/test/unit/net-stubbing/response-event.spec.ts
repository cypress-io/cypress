import { describe, it, expect, vi } from 'vitest'
import { onResponse } from '../../../src/cy/net-stubbing/events/response'

function runResponseHandler (handler: (res: any) => void) {
  const Cypress = {
    config: () => 4000,
    state: () => undefined,
  }

  const frame = {
    requestId: 'req1',
    subscription: { routeId: 'route1', await: true },
    data: {
      url: 'http://localhost:3500/foo',
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'text/plain' },
      body: 'foo',
    },
  }

  const request = { setLogFlag: vi.fn() }

  return onResponse(Cypress as any, frame as any, handler, {
    getRoute: vi.fn(),
    getRequest: () => request,
    emitNetEvent: vi.fn(),
    sendStaticResponse: vi.fn(),
  } as any)
}

describe('onResponse', () => {
  it('passes a valid res.statusCode and res.statusMessage on to the server', async () => {
    const result = await runResponseHandler((res) => {
      res.statusCode = 503
      res.statusMessage = 'Down For Maintenance'
    })

    expect(result?.changedData).toMatchObject({ statusCode: 503, statusMessage: 'Down For Maintenance' })
  })

  it.each([1000, 42, 200.5, '503'])('fails when res.statusCode is set to %o', async (statusCode) => {
    await expect(runResponseHandler((res) => {
      res.statusCode = statusCode
    })).rejects.toThrow('`res.statusCode` must be an integer between 100 and 999 (inclusive).')
  })

  it('fails when res.send is called with a non-integer statusCode', async () => {
    await expect(runResponseHandler((res) => {
      res.send({ statusCode: 200.5 })
    })).rejects.toThrow('`statusCode` must be an integer between 100 and 999 (inclusive).')
  })

  it('fails when res.statusMessage is set to a string with a line break', async () => {
    await expect(runResponseHandler((res) => {
      res.statusMessage = 'Bad\r\nInjected: header'
    })).rejects.toThrow('`res.statusMessage` must be a string without line breaks or other control characters.')
  })
})
