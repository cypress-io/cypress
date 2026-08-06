import { tapManagerDataSource } from './tap-manager-data-source'
import { useSnapshotStore } from '../runner/snapshot-store'
import type { AutIframe } from '../runner/aut-iframe'
import type { AutSnapshot } from '../runner/iframe-model'

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
      getAllTestStates: () => ({}),
      getAllTestsSummary: () => ({}),
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

  // Read against the real snapshot store, since that store is the only trace of a
  // pin made by hand in the reporter.
  describe('getPinnedSnapshot', () => {
    const PINNED_PROPS = { id: 'log-3', testId: 'r4', snapshots: [{ name: 'before' }, { name: 'after' }] } as AutSnapshot
    const autIframe = { restoreDom: () => {}, highlightEl: () => {}, removeHighlights: () => {} } as unknown as AutIframe

    it('reports nothing while the app is showing the live page', () => {
      expect(tapManagerDataSource.getPinnedSnapshot()).to.eq(undefined)
    })

    it('names the pinned command and the snapshot of it showing', () => {
      const store = useSnapshotStore()

      store.pinSnapshot(PINNED_PROPS)

      expect(tapManagerDataSource.getPinnedSnapshot()).to.deep.eq({ testId: 'r4', logId: 'log-3', index: 0 })

      store.changeState(1, autIframe)

      expect(tapManagerDataSource.getPinnedSnapshot()?.index).to.eq(1)

      store.unpinSnapshot()

      expect(tapManagerDataSource.getPinnedSnapshot()).to.eq(undefined)
    })

    it('reports nothing for a snapshot whose props name no log', () => {
      useSnapshotStore().pinSnapshot({ ...PINNED_PROPS, id: undefined, testId: undefined })

      expect(tapManagerDataSource.getPinnedSnapshot()).to.eq(undefined)
    })
  })
})
