import { IframeModel } from './iframe-model'
import type { AutSnapshot } from './iframe-model'
import { useSnapshotStore } from './snapshot-store'
import { createEventManager } from '../../cypress/component/support/ctSupport'

// A pin that arrives with no hover in front of it — the tap CLI, or a click faster
// than the reporter's 50ms hover debounce — is the only thing holding the live
// page, so it has to capture it or nothing can put it back.
describe('runner/iframe-model', () => {
  const LIVE_DOM = { name: 'live', body: { get: () => 'LIVE-BODY' }, htmlAttrs: {} }

  const snapshotProps = (id: string): AutSnapshot => {
    return { id, testId: 'r2', snapshots: [{ name: 'before' }, { name: 'after' }] } as unknown as AutSnapshot
  }

  const build = () => {
    const eventManager = createEventManager()
    const detachDom = cy.stub().returns(LIVE_DOM)
    const restoreDom = cy.stub()
    const model = new IframeModel(detachDom, restoreDom, cy.stub(), () => true, eventManager)

    model.listen()

    return { eventManager, detachDom, restoreDom, model }
  }

  it('captures the live page when a pin displaces it', () => {
    const { eventManager, detachDom, model } = build()

    eventManager.localBus.emit('pin:snapshot', snapshotProps('log-1'))

    expect(detachDom).to.have.been.calledOnce
    expect(model.originalState?.body).to.eq(LIVE_DOM.body)
  })

  it('leaves the live page captured by a hover preview alone', () => {
    const { eventManager, detachDom, model } = build()

    eventManager.localBus.emit('show:snapshot', snapshotProps('log-1'))
    expect(detachDom).to.have.been.calledOnce

    const captured = model.originalState

    eventManager.localBus.emit('pin:snapshot', snapshotProps('log-1'))

    // Re-capturing here would detach the previewed snapshot and restore it later
    // as if it were the live page.
    expect(detachDom).to.have.been.calledOnce
    expect(model.originalState).to.eq(captured)
  })

  it('restores the live page it captured when the pin is released', () => {
    const { eventManager, restoreDom } = build()

    eventManager.localBus.emit('pin:snapshot', snapshotProps('log-1'))
    eventManager.snapshotUnpinned()

    // `_clearSnapshots` restores on the next tick, so let the assertion retry.
    cy.wrap(restoreDom).should('have.been.calledWith', LIVE_DOM)
    cy.then(() => {
      expect(useSnapshotStore().isSnapshotPinned).to.eq(false)
    })
  })

  it('does not let a preview being dismissed restore over a pin that replaced it', () => {
    const { eventManager, restoreDom, model } = build()

    eventManager.localBus.emit('show:snapshot', snapshotProps('log-1'))

    // Mouse-out and pin land in the same tick: the deferred restore of the preview
    // would otherwise put the live page back over the pin, and drop the capture
    // with it — leaving the pin with nothing to release to.
    eventManager.localBus.emit('hide:snapshot')
    eventManager.localBus.emit('pin:snapshot', snapshotProps('log-2'))

    cy.wrap(null).should(() => {
      expect(restoreDom).not.to.have.been.calledWith(LIVE_DOM)
      expect(model.originalState?.body).to.eq(LIVE_DOM.body)
    })
  })
})
