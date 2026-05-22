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

    await core.correlateBrowserPreRequest({})
    core.forwardToOrigin({})
    await core.endRequestIfBlocked({ req: { proxiedUrl: 'http://example.com' } })
    await core.interceptResponse({})
    await core.setInjectionLevel({})
    await core.injectHtml({})
    await core.removeSecurity({})
    core.notifyIncomingRequest({})
    await core.attachCrossOriginCookies({})
    await core.copyCookiesFromResponse({})
    await core.notifyResponseStreamReceived({})
    core.notifyResponseEndedWithEmptyBody({}, { isCached: false })

    expect(stubs.commandLog.logInterception({ interception: {}, route: {} })).toBeUndefined()
  })
})
