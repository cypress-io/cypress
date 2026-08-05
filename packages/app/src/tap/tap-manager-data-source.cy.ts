import { EventEmitter } from 'events'
import { tapManagerDataSource } from './tap-manager-data-source'

describe('tap/tap-manager-data-source', () => {
  describe('getRunner', () => {
    let originalGetEventManager: typeof window.getEventManager

    beforeEach(() => {
      originalGetEventManager = window.getEventManager
    })

    afterEach(() => {
      window.getEventManager = originalGetEventManager
    })

    const installRunner = (runner: unknown, runComplete: boolean) => {
      const em = { getCypress: () => ({ runner }), runComplete }

      window.getEventManager = (() => em) as unknown as typeof window.getEventManager
    }

    const startedRunner = {
      getAllTestsState: () => ({}),
      getTestState: () => undefined,
      getStartTime: () => '2026-07-29T10:15:00.000Z',
    }

    it('serves a runner whose run has started', () => {
      installRunner(startedRunner, false)

      expect(tapManagerDataSource.getRunner()?.getStartTime()).to.eq('2026-07-29T10:15:00.000Z')
    })

    it('withholds a runner whose spec is installed but whose run has not started, however the event manager reports completion', () => {
      // The state every rerun passes through: this runner holds no test state
      // yet, while `runComplete` still belongs to the run being replaced —
      // together they used to serialize as a clean sweep of nothing.
      installRunner({ ...startedRunner, getStartTime: () => null }, true)

      expect(tapManagerDataSource.getRunner()).to.eq(undefined)
    })

    it('withholds a runner when no spec has been installed', () => {
      installRunner(undefined, true)

      expect(tapManagerDataSource.getRunner()).to.eq(undefined)
    })
  })

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
