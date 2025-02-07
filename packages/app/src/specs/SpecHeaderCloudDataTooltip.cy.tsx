import { SpecHeaderCloudDataTooltipFragmentDoc } from '../generated/graphql-test'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import { get, set } from 'lodash'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

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
    const userProjectStatusStore = useUserProjectStatusStore()

    cy.mountFragment(SpecHeaderCloudDataTooltipFragmentDoc, {
      onResult: (result) => {
        set(result, 'cloudViewer', { __typename: 'CloudUser', id: 'abc123' })

        switch (status) {
          case 'LOGGED_OUT':
            userProjectStatusStore.setUserFlag('isLoggedIn', false)
            break
          case 'NOT_CONNECTED':
            userProjectStatusStore.setUserFlag('isLoggedIn', true)
            userProjectStatusStore.setUserFlag('isOrganizationLoaded', true)
            userProjectStatusStore.setUserFlag('isMemberOfOrganization', true)
            userProjectStatusStore.setProjectFlag('isProjectConnected', false)
            userProjectStatusStore.setProjectFlag('isConfigLoaded', true)
            break
          case 'NOT_FOUND':
            userProjectStatusStore.setUserFlag('isLoggedIn', true)
            userProjectStatusStore.setProjectFlag('isNotFound', true)
            break
          case 'ACCESS_REQUESTED':
            userProjectStatusStore.setUserFlag('isLoggedIn', true)
            userProjectStatusStore.setProjectFlag('isNotAuthorized', true)

            set(result, 'currentProject.cloudProject', {
              __typename: 'CloudProjectUnauthorized',
              message: '',
              hasRequestedAccess: true,
            })

            break
          case 'UNAUTHORIZED':
            userProjectStatusStore.setUserFlag('isLoggedIn', true)
            userProjectStatusStore.setProjectFlag('isNotAuthorized', true)

            break
          case 'CONNECTED':
          default:
            userProjectStatusStore.setUserFlag('isLoggedIn', true)
            userProjectStatusStore.setUserFlag('isOrganizationLoaded', true)
            userProjectStatusStore.setUserFlag('isMemberOfOrganization', true)
            userProjectStatusStore.setProjectFlag('isProjectConnected', true)
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

          cy.contains('button', defaultMessages.specPage.requestSentButton).should('be.visible').should('be.disabled')
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
