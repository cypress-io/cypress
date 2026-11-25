import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestEventFilter } from '../../../lib/util/request-event-filter'
// Captured from `proxy-logging.cy.ts` in Chromium: each entry is a
// `request:event` the server sent the driver.
import events from '../../support/fixtures/server/driver-request-events.json'

type RequestEvent = { eventName: string, data: { requestId: string } }

describe('lib/util/request-event-filter', () => {
  let socket: { toDriver: ReturnType<typeof vi.fn> }
  let filter: RequestEventFilter

  const send = ({ eventName, data }: RequestEvent) => filter.toDriver('request:event', eventName, data)
  const sent = ({ eventName, data }: RequestEvent) => ['request:event', eventName, data]

  beforeEach(() => {
    socket = { toDriver: vi.fn() }
    filter = new RequestEventFilter(socket)
  })

  it('sends a response for a request the driver was told about', () => {
    send(events.interceptedImageRequest)
    send(events.interceptedImageResponse)

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(events.interceptedImageRequest),
      sent(events.interceptedImageResponse),
    ])
  })

  it('sends the response of an intercepted cy.visit()', () => {
    send(events.interceptedVisitRequest)
    send(events.interceptedVisitResponse)

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(events.interceptedVisitRequest),
      sent(events.interceptedVisitResponse),
    ])
  })

  it('drops a response for a request the driver was never told about', () => {
    send(events.interceptedImageRequest)
    send(events.unloggedStylesheetResponse)

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(events.interceptedImageRequest),
    ])
  })

  it('sends an error for a request the driver was told about', () => {
    send(events.forcedNetworkErrorRequest)
    send(events.forcedNetworkError)

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(events.forcedNetworkErrorRequest),
      sent(events.forcedNetworkError),
    ])
  })

  it('drops an error for a request the driver was never told about', () => {
    send(events.forcedNetworkError)

    expect(socket.toDriver.mock.calls).toStrictEqual([])
  })

  // Not captured: an error after the response, as when the connection drops
  // partway through the body. Built from the captured error, moved to the
  // captured image request.
  it('sends an error that arrives after the response', () => {
    const errorAfterResponse = {
      eventName: events.forcedNetworkError.eventName,
      data: { ...events.forcedNetworkError.data, requestId: events.interceptedImageRequest.data.requestId },
    }

    send(events.interceptedImageRequest)
    send(events.interceptedImageResponse)
    send(errorAfterResponse)

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(events.interceptedImageRequest),
      sent(events.interceptedImageResponse),
      sent(errorAfterResponse),
    ])
  })

  it('passes other events through', () => {
    filter.toDriver('cross:origin:cookies', [])

    expect(socket.toDriver.mock.calls).toStrictEqual([['cross:origin:cookies', []]])
  })

  it('forgets every request on reset', () => {
    send(events.interceptedImageRequest)
    filter.reset()
    send(events.interceptedImageResponse)

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(events.interceptedImageRequest),
    ])
  })

  // Request IDs in the format of the captured ones, which Chromium's Network
  // domain assigns, rather than captured ones.
  it('forgets the earliest requests once it holds 10,000', () => {
    const response = (requestId: string) => ({ eventName: 'response:received', data: { requestId, status: 200, headers: {} } })

    for (let i = 0; i <= 10_000; i++) {
      send({ eventName: 'incoming:request', data: { requestId: `7213.${i}` } })
    }

    socket.toDriver.mockClear()

    send(response('7213.0'))
    send(response('7213.1'))
    send(response('7213.10000'))

    expect(socket.toDriver.mock.calls).toStrictEqual([
      sent(response('7213.1')),
      sent(response('7213.10000')),
    ])
  })
})
