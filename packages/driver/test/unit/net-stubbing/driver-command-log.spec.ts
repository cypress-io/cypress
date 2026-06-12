import { describe, it, expect, vi } from 'vitest'
import { DriverCommandLogAdapter } from '../../../src/cy/net-stubbing/adapters/driver-command-log'

describe('DriverCommandLogAdapter', () => {
  it('delegates logInterception to supplied proxy logging hook', () => {
    const setFlag = vi.fn()
    const logInterception = vi.fn().mockReturnValue({ setFlag })
    const adapter = new DriverCommandLogAdapter({ logInterception })
    const interception = { requestId: 'req-1' }
    const route = { routeId: 'route-1' }

    const result = adapter.logInterception({ interception, route })

    expect(logInterception).toHaveBeenCalledWith(interception, route)
    expect(result?.setFlag).toBe(setFlag)
  })

  it('notifyIncomingRequest is a no-op on the driver', () => {
    const adapter = new DriverCommandLogAdapter({ logInterception: vi.fn() })

    expect(() => adapter.notifyIncomingRequest({})).not.toThrow()
  })
})
