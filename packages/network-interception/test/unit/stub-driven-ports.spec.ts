import { describe, it, expect } from 'vitest'
import { createStubDrivenPorts } from '../../lib/testing/stub-driven-ports'
import { NetworkInterceptionCore, NetworkPolicyRegistry } from '../../lib'

describe('testing/stub-driven-ports', () => {
  it('creates no-op implementations for every driven port', async () => {
    const stubs = createStubDrivenPorts()
    const core = new NetworkInterceptionCore({
      ...stubs,
      policyRegistration: new NetworkPolicyRegistry(),
    })

    await core.setInjectionLevel({})
    await core.injectHtml({})
    await core.removeSecurity({})
    core.notifyIncomingRequest({})
    await core.attachCrossOriginCookies({})
    await core.copyCookiesFromResponse({})
    await core.notifyResponseStreamReceived({})
    core.notifyResponseEndedWithEmptyBody({}, { isCached: false })

    await stubs.interceptionEvents.emitAndAwait('before:request', { eventId: '1' } as any)
    stubs.interceptionEvents.emit('after:response', { eventId: '2' } as any)
    stubs.interceptionEvents.resolveEventHandler({ eventId: '3', stopPropagation: false })

    expect(stubs.commandLog.logInterception({ interception: {}, route: {} })).toBeUndefined()
  })
})
