import SnapshotControls from './SnapshotControls.vue'
import { autSnapshot } from '../../cypress/support/fixtures'
import { useSnapshotStore } from './snapshot-store'
import { createEventManager, createTestAutIframe } from '../../cypress/e2e/support/ctSupport'

// function createTestAutIframe () {
//   return new class {
//     removeHighlights () {}
//   }
// }

describe('SnapshotControls', () => {
  const mountSnapshotControls = (
    eventManager = createEventManager(),
    autIframe = createTestAutIframe(),
  ) => {
    return cy.mount(() => (
      <SnapshotControls
        eventManager={eventManager}
        getAutIframe={() => autIframe}
      />
    ))
  }

  it('renders nothing when messageTitle is undefined', () => {
    mountSnapshotControls()
    cy.get('[data-cy="snapshot-highlight-controls"]').should('not.exist')
    cy.get('[data-cy="snapshot-message"]').should('not.exist')
    cy.get('[data-cy="snapshot-change-state"]').should('not.exist')
  })

  it('renders snapshot title when one is pinned', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.get('[data-cy="snapshot-message"]').contains('DOM Snapshot')
    cy.get('[data-cy="snapshot-message"]').contains('(pinned)')
  })

  it('renders snapshot pinned status', () => {
    mountSnapshotControls()
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
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.then(() => cy.get('[data-cy="snapshot-message"]').should('exist'))
    .then(() => snapshotStore.clearMessage())
    .get('[data-cy="snapshot-message"]').should('not.exist')
  })

  it('shows snapshot with custom message', () => {
    mountSnapshotControls()
    const message = 'This is a custom message'
    const snapshotStore = useSnapshotStore()

    snapshotStore.showSnapshot(message)
    cy.get('[data-cy="snapshot-message"]').contains(message)
  })

  it('does not show highlight controls if no element present on snapshot', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(autSnapshot)
    cy.get('[data-cy="snapshot-highlight-controls"]').should('not.exist')
  })

  it('toggles highlight controls if snapshot has an element', () => {
    const snapshotStore = useSnapshotStore()
    const eventManager = createEventManager()
    const autIframe = createTestAutIframe()
    const removeHighlights = cy.stub(autIframe, 'removeHighlights')

    // we don't have an iframe-model since this is a CT test, but we can
    // simulate it by registering the same unpin:snapshot event it does.
    eventManager.on('unpin:snapshot', () => snapshotStore.unpinSnapshot())
    snapshotStore.pinSnapshot({ ...autSnapshot, $el: 'some element' })

    mountSnapshotControls(eventManager, autIframe)
    cy.get('[data-cy="snapshot-highlight-controls"]').should('exist')
    cy.get('[data-cy="toggle-snapshot-highlights"]').as('toggle')
    cy.get('@toggle').should('have.attr', 'title', 'Hide highlights')
    cy.get('@toggle').click().then(() => {
      expect(removeHighlights).to.have.been.calledOnce
    })

    cy.get('@toggle').should('have.attr', 'title', 'Show highlights')
    cy.get('[data-cy="unpin-snapshot"]').click()
    cy.get('[data-cy="snapshot-highlight-controls"]').should('not.exist')
  })

  it('shows running test error', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.setTestsRunningError()
    cy.get('[data-cy="snapshot-message"]').contains('Cannot show Snapshot while tests are running')
  })

  it('shows snapshot missing error', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.setMissingSnapshotMessage()
    cy.get('[data-cy="snapshot-message"]').contains('The snapshot is missing. Displaying current state of the DOM.')
  })
})
