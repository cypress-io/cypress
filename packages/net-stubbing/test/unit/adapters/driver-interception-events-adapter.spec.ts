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
    } as any)

    expect(state.pendingEventHandlers['event-1']).toBeTypeOf('function')
    expect(socket.toDriver).toHaveBeenCalledOnce()

    adapter.resolveEventHandler({
      eventId: 'event-1',
      changedData: { url: 'http://example.com' },
      stopPropagation: false,
    })

    await expect(promise).resolves.toEqual({
      eventId: 'event-1',
      changedData: { url: 'http://example.com' },
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
