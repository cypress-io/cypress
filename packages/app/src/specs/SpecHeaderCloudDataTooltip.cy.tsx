import { SpecHeaderCloudDataTooltipFragmentDoc } from '../generated/graphql-test'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import { get, set } from 'lodash'
import { defaultMessages } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

const tooltipContentSelector = '.v-popper'

describe('<SpecHeaderCloudDataTooltip />', () => {
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
    const loginConnectStore = useLoginConnectStore()

    cy.mountFragment(SpecHeaderCloudDataTooltipFragmentDoc, {
      onResult: (result) => {
        set(result, 'cloudViewer', { __typename: 'CloudUser', id: 'abc123' })

        switch (status) {
          case 'LOGGED_OUT':
            loginConnectStore.setUserFlag('isLoggedIn', false)
            break
          case 'NOT_CONNECTED':
            loginConnectStore.setUserFlag('isLoggedIn', true)
            loginConnectStore.setUserFlag('isOrganizationLoaded', true)
            loginConnectStore.setUserFlag('isMemberOfOrganization', true)
            loginConnectStore.setProjectFlag('isProjectConnected', false)
            loginConnectStore.setProjectFlag('isConfigLoaded', true)
            break
          case 'NOT_FOUND':
            loginConnectStore.setUserFlag('isLoggedIn', true)
            loginConnectStore.setProjectFlag('isNotFound', true)
            break
          case 'ACCESS_REQUESTED':
            loginConnectStore.setUserFlag('isLoggedIn', true)
            loginConnectStore.setProjectFlag('isNotAuthorized', true)

            set(result, 'currentProject.cloudProject', {
              __typename: 'CloudProjectUnauthorized',
              message: '',
              hasRequestedAccess: true,
            })

            break
          case 'UNAUTHORIZED':
            loginConnectStore.setUserFlag('isLoggedIn', true)
            loginConnectStore.setProjectFlag('isNotAuthorized', true)

            break
          case 'CONNECTED':
          default:
            loginConnectStore.setUserFlag('isLoggedIn', true)
            loginConnectStore.setUserFlag('isOrganizationLoaded', true)
            loginConnectStore.setUserFlag('isMemberOfOrganization', true)
            loginConnectStore.setProjectFlag('isProjectConnected', true)
            break
        }
      },
      render: (gql) => {
        const showLoginConnectSpy = cy.spy().as('showLoginConnectSpy')

        return (
          <div class="flex justify-around">
            <SpecHeaderCloudDataTooltip
              gql={gql}
              mode={mode as any}
              onShowLoginConnect={showLoginConnectSpy}
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
          cy.get(tooltipContentSelector).trigger('mouseenter')

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
          cy.get(tooltipContentSelector).trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.notConnected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('connect-button')
          .should('be.visible')
          .click()

          cy.get('@showLoginConnectSpy').should('have.been.calledOnce')

          cy.percySnapshot()
        })
      })

      context('unauthorized', () => {
        beforeEach(() => {
          mountWithStatus('UNAUTHORIZED', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get(tooltipContentSelector).trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.noAccess).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.contains('button', defaultMessages.specPage.requestAccessButton).should('be.visible')
          cy.percySnapshot()
        })
      })

      context('access requested', () => {
        beforeEach(() => {
          mountWithStatus('ACCESS_REQUESTED', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get(tooltipContentSelector).trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.noAccess).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.contains('button', defaultMessages.specPage.requestSentButton).should('be.visible')

          cy.percySnapshot()
        })
      })

      context('logged out', () => {
        beforeEach(() => {
          mountWithStatus('LOGGED_OUT', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get(tooltipContentSelector).trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.notConnected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('login-button')
          .should('be.visible')
          .click()

          cy.get('@showLoginConnectSpy').should('have.been.calledOnce')

          cy.percySnapshot()
        })
      })

      context('not found', () => {
        beforeEach(() => {
          mountWithStatus('NOT_FOUND', mode, msgKeys)
        })

        it('should render expected tooltip content', () => {
          cy.get(tooltipContentSelector).trigger('mouseenter')

          cy.findByTestId('cloud-data-tooltip-content')
          .should('be.visible')
          .and('contain', get(defaultMessages, msgKeys.notConnected).replace('{0}', get(defaultMessages, msgKeys.docs)))

          cy.findByTestId('reconnect-button')
          .should('be.visible')
          .click()

          cy.get('@showLoginConnectSpy').should('have.been.calledOnce')

          cy.percySnapshot()
        })
      })

      it('delays popping tooltip', () => {
        cy.clock()
        mountWithStatus('CONNECTED', mode, msgKeys)
        cy.get(tooltipContentSelector).trigger('mouseenter')
        cy.findByTestId('cloud-data-tooltip-content')
        .should('not.exist')

        cy.tick(500)

        cy.findByTestId('cloud-data-tooltip-content')
        .should('be.visible')
      })
    })
  })
})
