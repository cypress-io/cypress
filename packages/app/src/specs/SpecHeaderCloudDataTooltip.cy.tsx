import { SpecHeaderCloudDataTooltipFragmentDoc } from '../generated/graphql-test'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import { set } from 'lodash'
import { defaultMessages } from '@cy/i18n'

describe('SpecHeaderCloudDataTooltip', () => {
  function mountWithStatus (status: 'NOT_FOUND' | 'LOGGED_OUT' | 'CONNECTED' | 'NOT_CONNECTED' | 'UNAUTHORIZED') {
    cy.mountFragment(SpecHeaderCloudDataTooltipFragmentDoc, {
      onResult: (ctx) => {
        set(ctx, 'cloudViewer', { __typename: 'CloudUser', id: 'abc123' })

        switch (status) {
          case 'LOGGED_OUT':
            set(ctx, 'cloudViewer', null)
            break
          case 'NOT_CONNECTED':
            set(ctx, 'currentProject.cloudProject.__typename', null)
            break
          case 'NOT_FOUND':
            set(ctx, 'currentProject.cloudProject.__typename', 'CloudProjectNotFound')
            break
          case 'UNAUTHORIZED':
            set(ctx, 'currentProject.cloudProject.__typename', 'CloudProjectUnauthorized')
            break
          case 'CONNECTED':
          default:
            set(ctx, 'currentProject.cloudProject.__typename', 'CloudProjectSpec')
            break
        }
      },
      render: (gql) => {
        const showLoginSpy = cy.spy().as('showLoginSpy')
        const showConnectToProjectSpy = cy.spy().as('showConnectToProjectSpy')

        return (
          <SpecHeaderCloudDataTooltip
            gql={gql}
            headerTextKeyPath="specPage.latestRuns.header"
            connectedTextKeyPath="specPage.latestRuns.tooltip.connected"
            notConnectedTextKeyPath="specPage.latestRuns.tooltip.notConnected"
            noAccessTextKeyPath="specPage.latestRuns.tooltip.noAccess"
            docsTextKeyPath="specPage.latestRuns.tooltip.linkText"
            docsUrl="https://dummy.cypress.io/specs-latest-runs?utm_medium=Specs+Latest+Runs+Tooltip&utm_campaign=Latest+Runs"
            data-cy="latest-runs-header"
            onShowLogin={showLoginSpy}
            onShowConnectToProject={showConnectToProjectSpy}
          />)
      },
    })
  }

  context('connected', () => {
    beforeEach(() => {
      mountWithStatus('CONNECTED')
    })

    it('should render expected tooltip content', () => {
      cy.get('.v-popper').trigger('mouseenter')

      cy.findByTestId('cloud-data-tooltip-content')
      .should('be.visible')
      .and('contain', defaultMessages.specPage.latestRuns.tooltip.connected.replace('{0}', defaultMessages.specPage.latestRuns.tooltip.linkText))

      cy.get('button').should('not.exist')

      cy.percySnapshot()
    })
  })

  context('not connected', () => {
    beforeEach(() => {
      mountWithStatus('NOT_CONNECTED')
    })

    it('should render expected tooltip content', () => {
      cy.get('.v-popper').trigger('mouseenter')

      cy.findByTestId('cloud-data-tooltip-content')
      .should('be.visible')
      .and('contain', defaultMessages.specPage.latestRuns.tooltip.notConnected.replace('{0}', defaultMessages.specPage.latestRuns.tooltip.linkText))

      cy.findByTestId('connect-button')
      .should('be.visible')
      .click()

      cy.get('@showConnectToProjectSpy').should('have.been.calledOnce')

      cy.percySnapshot()
    })
  })

  context('unauthorized', () => {
    beforeEach(() => {
      mountWithStatus('UNAUTHORIZED')
    })

    it('should render expected tooltip content', () => {
      cy.get('.v-popper').trigger('mouseenter')

      cy.findByTestId('cloud-data-tooltip-content')
      .should('be.visible')
      .and('contain', defaultMessages.specPage.latestRuns.tooltip.noAccess.replace('{0}', defaultMessages.specPage.latestRuns.tooltip.linkText))

      cy.findByTestId('request-access-button')
      .should('be.visible')
      .click()

      cy.percySnapshot()
    })
  })

  context('logged out', () => {
    beforeEach(() => {
      mountWithStatus('LOGGED_OUT')
    })

    it('should render expected tooltip content', () => {
      cy.get('.v-popper').trigger('mouseenter')

      cy.findByTestId('cloud-data-tooltip-content')
      .should('be.visible')
      .and('contain', defaultMessages.specPage.latestRuns.tooltip.notConnected.replace('{0}', defaultMessages.specPage.latestRuns.tooltip.linkText))

      cy.findByTestId('login-button')
      .should('be.visible')
      .click()

      cy.get('@showLoginSpy').should('have.been.calledOnce')

      cy.percySnapshot()
    })
  })

  context('not found', () => {
    beforeEach(() => {
      mountWithStatus('NOT_FOUND')
    })

    it('should render expected tooltip content', () => {
      cy.get('.v-popper').trigger('mouseenter')

      cy.findByTestId('cloud-data-tooltip-content')
      .should('be.visible')
      .and('contain', defaultMessages.specPage.latestRuns.tooltip.notConnected.replace('{0}', defaultMessages.specPage.latestRuns.tooltip.linkText))

      cy.findByTestId('reconnect-button')
      .should('be.visible')
      .click()

      cy.get('@showConnectToProjectSpy').should('have.been.calledOnce')

      cy.percySnapshot()
    })
  })
})
