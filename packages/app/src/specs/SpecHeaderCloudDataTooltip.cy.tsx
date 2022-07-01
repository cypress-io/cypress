import { SpecHeaderCloudDataTooltipFragmentDoc, SpecHeaderCloudDataTooltip_RequestAccessDocument } from '../generated/graphql-test'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import { get, set } from 'lodash'
import { defaultMessages } from '@cy/i18n'

describe('SpecHeaderCloudDataTooltip', () => {
  function mountWithStatus (
    status: 'NOT_FOUND' | 'LOGGED_OUT' | 'CONNECTED' | 'NOT_CONNECTED' | 'UNAUTHORIZED' | 'ACCESS_REQUESTED',
    mode: string,
    msgKeys: {
      header: string
      connected: string
      notConnected: string
      noAccess: string
      docs: string
    },
  ) {
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
          case 'ACCESS_REQUESTED':
            set(ctx, 'currentProject.cloudProject.__typename', 'CloudProjectUnauthorized')
            set(ctx, 'currentProject.cloudProject.hasRequestedAccess', true)
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
          <div class="flex justify-around">
            <SpecHeaderCloudDataTooltip
              gql={gql}
              mode={mode as any}
              onShowLogin={showLoginSpy}
              onShowConnectToProject={showConnectToProjectSpy}
            />
          </div>)
      },
    })
  }

  [{
    mode: 'AVG_DURATION',
    msgKeys: {
      header: 'specPage.averageDuration.header',
      connected: 'specPage.averageDuration.tooltip.connected',
      notConnected: 'specPage.averageDuration.tooltip.notConnected',
      noAccess: 'specPage.averageDuration.tooltip.noAccess',
      docs: 'specPage.averageDuration.tooltip.linkText',
    },
  }, {
    mode: 'LATEST_RUNS',
    msgKeys: {
      header: 'specPage.latestRuns.header',
      connected: 'specPage.latestRuns.tooltip.connected',
      notConnected: 'specPage.latestRuns.tooltip.notConnected',
      noAccess: 'specPage.latestRuns.tooltip.noAccess',
      docs: 'specPage.latestRuns.tooltip.linkText',
    },
  }].forEach(({ mode, msgKeys }) => {
    context(mode, () => {
      context('connected', () => {
        beforeEach(() => {
          mountWithStatus('CONNECTED', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.connected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('cloud-data-tooltip-content').find('button').should('not.exist')

          cy.percySnapshot()
        })
      })

      context('not connected', () => {
        beforeEach(() => {
          mountWithStatus('NOT_CONNECTED', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.notConnected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('connect-button')
          .should('be.visible')
          .click()

          cy.get('@showConnectToProjectSpy').should('have.been.calledOnce')

          cy.percySnapshot()
        })
      })

      context('unauthorized', () => {
        beforeEach(() => {
          mountWithStatus('UNAUTHORIZED', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.noAccess).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.percySnapshot()
        })

        it('should update to "Request Sent" when button is triggered', () => {
          cy.stubMutationResolver(SpecHeaderCloudDataTooltip_RequestAccessDocument, (defineResult) => {
            return defineResult({
              cloudProjectRequestAccess: {
                __typename: 'CloudProjectUnauthorized',
                message: 'msg',
                hasRequestedAccess: true,
              },
            })
          })

          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('request-access-button')
          .should('be.visible')
          .click()

          cy.findByTestId('access-requested-button')
          .should('be.visible')
          .should('be.disabled')
        })
      })

      context('access requested', () => {
        beforeEach(() => {
          mountWithStatus('ACCESS_REQUESTED', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.noAccess).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('access-requested-button')
          .should('be.visible')
          .should('be.disabled')

          cy.percySnapshot()
        })
      })

      context('logged out', () => {
        beforeEach(() => {
          mountWithStatus('LOGGED_OUT', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.notConnected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('login-button')
          .should('be.visible')
          .click()

          cy.get('@showLoginSpy').should('have.been.calledOnce')

          cy.percySnapshot()
        })
      })

      context('not found', () => {
        beforeEach(() => {
          mountWithStatus('NOT_FOUND', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get('.v-popper').trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.notConnected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('reconnect-button')
          .should('be.visible')
          .click()

          cy.get('@showConnectToProjectSpy').should('have.been.calledOnce')

          cy.percySnapshot()
        })
      })
    })
  })
})
