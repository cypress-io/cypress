import { describe, it, expect } from 'vitest'
import { createStubDrivenPorts } from '../../lib/testing/stub-driven-ports'

describe('testing/stub-driven-ports', () => {
  it('creates no-op implementations for every driven port', async () => {
    const stubs = createStubDrivenPorts()

    await stubs.documentPreparation.setInjectionLevel({})
    await stubs.documentPreparation.injectHtml({})
    await stubs.documentPreparation.removeSecurity({})
    stubs.commandLog.notifyIncomingRequest({})
    await stubs.cookieState.attachCrossOriginCookies({})
    await stubs.cookieState.copyCookiesFromResponse({})
    await stubs.networkCapture.notifyResponseStreamReceived({})
    stubs.networkCapture.notifyResponseEndedWithEmptyBody({}, { isCached: false })

    await stubs.interceptionEvents.emitAndAwait('before:request', { eventId: '1' } as any)
    stubs.interceptionEvents.emit('after:response', { eventId: '2' } as any)
    stubs.interceptionEvents.resolveEventHandler({ eventId: '3', stopPropagation: false })

    expect(stubs.commandLog.logInterception({ interception: {}, route: {} })).toBeUndefined()
  })
})
