import { SpecCloudDataHoverButtonFragmentDoc } from '../generated/graphql-test'
import SpecsListCloudButton from './SpecsListCloudButton.vue'
import { set } from 'lodash'

describe('<SpecsListCloudButton>', { viewportWidth: 300, viewportHeight: 400 }, () => {
  function mountWithStatus (
    status: 'NOT_FOUND' | 'LOGGED_OUT' | 'NOT_CONNECTED' | 'UNAUTHORIZED' | 'ACCESS_REQUESTED',
  ) {
    cy.mountFragment(SpecCloudDataHoverButtonFragmentDoc, {
      onResult: (result) => {
        set(result, 'cloudViewer', { __typename: 'CloudUser', id: 'abc123' })

        switch (status) {
          case 'LOGGED_OUT':
            set(result, 'cloudViewer', null)
            break
          case 'NOT_CONNECTED':
            set(result, 'currentProject.cloudProject.__typename', null)
            break
          case 'NOT_FOUND':
            set(result, 'currentProject.cloudProject.__typename', 'CloudProjectNotFound')
            break
          case 'ACCESS_REQUESTED':
            set(result, 'currentProject.cloudProject', {
              __typename: 'CloudProjectUnauthorized',
              message: '',
              hasRequestedAccess: true,
            })

            break
          case 'UNAUTHORIZED':
            set(result, 'currentProject.cloudProject', {
              __typename: 'CloudProjectUnauthorized',
              message: '',
              hasRequestedAccess: false,
            })

            break
          default:
            set(result, 'currentProject.cloudProject.__typename', 'CloudProjectSpec')
            break
        }
      },
      render: (gql) => {
        const showLoginConnectSpy = cy.spy().as('showLoginConnect')
        const requestAccessSpy = cy.spy().as('requestAccessSpy')

        return (
          <div class="flex justify-around">
            <SpecsListCloudButton
              gql={gql}
              projectConnectionStatus={status}
              onShowLoginConnect={showLoginConnectSpy}
              onRequestAccess={requestAccessSpy}
            />
          </div>)
      },
    })
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

      cy.get('@showLoginConnect').should('have.been.calledOnce')

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

      cy.get('@showLoginConnect').should('have.been.calledOnce')

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

      cy.get('@requestAccessSpy').should('have.been.calledOnce')

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
