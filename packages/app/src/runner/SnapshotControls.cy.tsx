import SnapshotControls from './SnapshotControls.vue'
import { autSnapshot } from '../../cypress/support/fixtures'
import { useSnapshotStore } from './snapshot-store'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

const snapshotWithSnapshots = { ...autSnapshot }
const snapshotPinned = { ...autSnapshot, snapshots: [] }

const snapshotControlsSelector = '[data-testid=snapshot-controls]'
const unpinButtonSelector = '[data-testid=unpin]'

describe('SnapshotControls', { viewportHeight: 200, viewportWidth: 500 }, () => {
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
    cy.get(snapshotControlsSelector).should('not.exist')
  })

  it('renders the "pinned" snapshot title', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(snapshotPinned)
    cy.get('body')
    .findByText('Pinned')
    .should('be.visible')
  })

  it('pinned snapshots should not be dismissible', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(snapshotPinned)
    cy.get('body')
    .findByText('Pinned')
    .should('be.visible')
    .get(unpinButtonSelector)
    .should('not.exist')
  })

  it('clears snapshot message', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(snapshotWithSnapshots)
    cy.get('body')
    .findByText('Pinned')
    .should('be.visible')
    .get(unpinButtonSelector)
    .click({ force: true })
    .get('body')
    .findByText('Pinned')
    .should('not.exist')
  })

  it('does not show highlight controls if no element present on snapshot', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.pinSnapshot(snapshotWithSnapshots)
    cy.get('body').findByText('Highlights').should('not.exist')
  })

  it('toggles highlight controls if snapshot has an element', () => {
    const snapshotStore = useSnapshotStore()
    const eventManager = createEventManager()
    const autIframe = createTestAutIframe()

    // we don't have an iframe-model since this is a CT test, but we can
    // simulate it by registering the same unpin:snapshot event it does.
    eventManager.on('unpin:snapshot', () => snapshotStore.$reset())

    snapshotStore.pinSnapshot({ ...snapshotWithSnapshots, $el: document.body })

    mountSnapshotControls(eventManager, autIframe)
    cy.get('body')
    .findByLabelText(defaultMessages.runner.snapshot.highlightsLabel)
    .click({ force: true })
  })

  it('shows running test error', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.setTestsRunningError()
    cy.get('body')
    .findByText('Cannot show snapshot while tests are running')
    .should('be.visible')
  })

  it('shows snapshot missing error', () => {
    mountSnapshotControls()
    const snapshotStore = useSnapshotStore()

    snapshotStore.setMissingSnapshotMessage()
    cy.get('body')
    .findByText('The snapshot is missing. Displaying current state of the DOM.')
    .should('be.visible')
  })
})
