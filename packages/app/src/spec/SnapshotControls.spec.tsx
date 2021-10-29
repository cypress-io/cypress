import SnapshotControls from './SnapshotControls.vue'
import { autSnapshot } from '../../cypress/support/fixtures'
import { useSnapshotStore } from './snapshot-store'
import { createEventManager } from '../../cypress/e2e/support/ctSupport'

describe('SnapshotControls', () => {
  const mountSnapshotControls = () => {
    const eventManager = createEventManager()

    return cy.mount(() => <SnapshotControls eventManager={eventManager} />)
  }

  beforeEach(() => {
    return mountSnapshotControls()
  })

  it('renders nothing when messageTitle is undefined', () => {
    cy.get('[data-cy="snapshot-highlight-controls"]').should('not.exist')
    cy.get('[data-cy="snapshot-message"]').should('not.exist')
    cy.get('[data-cy="snapshot-change-state"]').should('not.exist')
  })

  it('renders snapshot title when one is pinned', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.get('[data-cy="snapshot-message"]').contains('DOM Snapshot')
    cy.get('[data-cy="snapshot-message"]').contains('(pinned)')
  })

  it('renders snapshot pinned status', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.get('[data-cy="snapshot-message"]').contains('DOM Snapshot')
    cy.get('[data-cy="snapshot-message"]').contains('(pinned)')
    .then(() => {
      snapshotStore.unpinSnapshot()
      cy.get('[data-cy="snapshot-message"]').should('not.contain', '(pinned)')
    })
  })

  it('clears snapshot message', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.then(() => cy.get('[data-cy="snapshot-message"]').should('exist'))
    .then(() => snapshotStore.clearMessage())
    .get('[data-cy="snapshot-message"]').should('not.exist')
  })

  it('shows snapshot with custom message', () => {
    const message = 'This is a custom message'
    const snapshotStore = useSnapshotStore()

    snapshotStore.showSnapshot(message)
    cy.get('[data-cy="snapshot-message"]').contains(message)
  })

  it('does not show highlight controls if no element present on snapshot', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.get('[data-cy="snapshot-highlight-controls"]').should('not.exist')
  })

  it('toggles highlight controls if snapshot has an element', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot({ ...autSnapshot, $el: 'some element' })
    cy.get('[data-cy="snapshot-highlight-controls"]').should('exist')
  })

  it('shows running test error', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.setTestsRunningError()
    cy.get('[data-cy="snapshot-message"]').contains('Cannot show Snapshot while tests are running')
  })

  it('shows snapshot missing error', () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.setMissingSnapshotMessage()
    cy.get('[data-cy="snapshot-message"]').contains('The snapshot is missing. Displaying current state of the DOM.')
  })
})
