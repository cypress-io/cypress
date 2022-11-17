import SpecsListCloudButton from './SpecsListCloudButton.vue'

describe('<SpecsListCloudButton>', { viewportWidth: 300, viewportHeight: 400 }, () => {
  function mountWithStatus (
    status: 'NOT_FOUND' | 'LOGGED_OUT' | 'NOT_CONNECTED' | 'UNAUTHORIZED' | 'ACCESS_REQUESTED',
  ) {
    cy.mount(<SpecsListCloudButton projectConnectionStatus={status} />)
  }

  function takeSnapshots () {
    cy.viewport(800, 100)
    cy.percySnapshot('medium')
    cy.viewport(1200, 100)
    cy.percySnapshot('wide')
  }

  context('not connected', () => {
    beforeEach(() => {
      mountWithStatus('NOT_CONNECTED')
    })

    it('should render button', () => {
      cy.findByTestId('cloud-button')
      .should('exist')
      .click()

      takeSnapshots()
    })
  })

  context('logged out', () => {
    beforeEach(() => {
      mountWithStatus('LOGGED_OUT')
    })

    it('renders', () => {
      cy.findByTestId('cloud-button')
      .should('exist')
      .click()

      takeSnapshots()
    })
  })

  context('unauthorized', () => {
    beforeEach(() => {
      mountWithStatus('UNAUTHORIZED')
    })

    it('renders', () => {
      cy.findByTestId('cloud-button')
      .should('exist')
      .click()

      takeSnapshots()
    })
  })

  context('access requested', () => {
    beforeEach(() => {
      mountWithStatus('ACCESS_REQUESTED')
    })

    it('renders', () => {
      cy.findByTestId('cloud-button')
      .should('exist')
      .should('be.disabled')

      takeSnapshots()
    })
  })
})
