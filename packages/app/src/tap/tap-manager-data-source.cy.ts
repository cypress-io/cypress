import { EventEmitter } from 'events'
import { tapManagerDataSource } from './tap-manager-data-source'

describe('tap/tap-manager-data-source', () => {
  describe('onSnapshotUnpinned', () => {
    let originalGetEventManager: typeof window.getEventManager

    beforeEach(() => {
      originalGetEventManager = window.getEventManager
    })

    afterEach(() => {
      window.getEventManager = originalGetEventManager
    })

    const installEventManager = () => {
      const em = { localBus: new EventEmitter(), reporterBus: new EventEmitter() }

      window.getEventManager = (() => em) as unknown as typeof window.getEventManager

      return em
    }

    it('hears the localBus unpin event — the only signal the reporter-click unpin emits', () => {
      const em = installEventManager()
      const handler = cy.stub()

      tapManagerDataSource.onSnapshotUnpinned(handler)

      // Clicking the pinned command in the reporter funnels through
      // `runner:unpin:snapshot` → `_unpinSnapshot`, which emits only this
      // localBus event — no `reporter:snapshot:unpinned` follows.
      em.localBus.emit('unpin:snapshot')

      expect(handler).to.have.been.calledOnce
    })

    it('stops listening once the returned disposer runs', () => {
      const em = installEventManager()
      const handler = cy.stub()

      const stopListening = tapManagerDataSource.onSnapshotUnpinned(handler)

      stopListening()
      em.localBus.emit('unpin:snapshot')

      expect(handler).not.to.have.been.called
    })

    it('returns a no-op disposer when the event manager is not mounted', () => {
      window.getEventManager = undefined as unknown as typeof window.getEventManager

      const stopListening = tapManagerDataSource.onSnapshotUnpinned(cy.stub())

      expect(() => stopListening()).not.to.throw
    })
  })
})
