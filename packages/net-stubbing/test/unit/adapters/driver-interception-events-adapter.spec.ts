import { describe, it, expect, vi } from 'vitest'
import { DriverInterceptionEventsAdapter } from '../../../lib/adapters/driver-interception-events-adapter'
import { state as netStubbingState } from '../../../lib/server/state'

describe('DriverInterceptionEventsAdapter', () => {
  it('registers pending handlers on emitAndAwait and resolves them', async () => {
    const state = netStubbingState()
    const socket = { toDriver: vi.fn() }

    const adapter = new DriverInterceptionEventsAdapter({ state, socket })

    const promise = adapter.emitAndAwait('before:request', {
      eventId: 'event-1',
      data: {
        inFlightInterceptId: 'intercept-1',
        url: 'http://example.com',
        method: 'GET',
        headers: {},
      },
    } as any)

    expect(state.pendingEventHandlers['event-1']).toMatchObject({
      eventName: 'before:request',
    })

    expect(socket.toDriver).toHaveBeenCalledOnce()
    expect(socket.toDriver).toHaveBeenCalledWith('net:stubbing:event', 'before:request', expect.objectContaining({
      eventId: 'event-1',
      data: expect.objectContaining({
        url: 'http://example.com',
        method: 'GET',
        httpVersion: '1.1',
        resourceType: 'other',
      }),
    }))

    adapter.resolveEventHandler({
      eventId: 'event-1',
      changedData: {
        url: 'http://example.com/changed',
        method: 'GET',
        headers: {},
        body: '',
        query: {},
        httpVersion: '1.1',
        resourceType: 'other',
      },
      stopPropagation: false,
    })

    await expect(promise).resolves.toEqual({
      changedData: {
        inFlightInterceptId: '',
        url: 'http://example.com/changed',
        method: 'GET',
        headers: {},
        body: '',
        resourceType: 'other',
      },
      stopPropagation: false,
    })

    expect(state.pendingEventHandlers['event-1']).toBeUndefined()
  })

  it('emits fire-and-forget driver events', () => {
    const state = netStubbingState()
    const socket = { toDriver: vi.fn() }

    const adapter = new DriverInterceptionEventsAdapter({ state, socket })

    adapter.emit('after:response', { eventId: 'event-2' } as any)

    expect(socket.toDriver).toHaveBeenCalledOnce()
  })
})
