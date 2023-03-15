import SidebarNavigation from './SidebarNavigation.vue'
import { defaultMessages } from '@cy/i18n'
import { CloudRunStatus, SidebarNavigationFragment, SidebarNavigationFragmentDoc, SideBarNavigation_SetPreferencesDocument } from '../generated/graphql-test'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'
import { cloneDeep } from 'lodash'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

function mountComponent (props: { initialNavExpandedVal?: boolean, cloudProject?: { status: CloudRunStatus, numFailedTests: number }, isLoading?: boolean, online?: boolean} = {}) {
  const withDefaults = { initialNavExpandedVal: false, isLoading: false, online: true, ...props }
  let _gql: SidebarNavigationFragment

  cy.stubMutationResolver(SideBarNavigation_SetPreferencesDocument, (defineResult) => {
    _gql.localSettings.preferences.isSideNavigationOpen = !_gql.localSettings.preferences.isSideNavigationOpen

    return defineResult({ setPreferences: _gql })
  })

  cy.mountFragment(SidebarNavigationFragmentDoc, {
    variableTypes: {
      runNumber: 'Int',
      hasCurrentRun: 'Boolean',
    },
    variables: {
      runNumber: 1,
      hasCurrentRun: true,
    },
    onResult (gql) {
      if (!gql.currentProject) return

      if (gql.currentProject?.cloudProject?.__typename === 'CloudProject' && withDefaults.cloudProject) {
        gql.currentProject.cloudProject.runByNumber = cloneDeep(CloudRunStubs.failingWithTests)
        gql.currentProject.cloudProject.runByNumber.status = withDefaults.cloudProject.status as CloudRunStatus

        gql.currentProject.cloudProject.runByNumber.totalFailed = withDefaults.cloudProject.numFailedTests
      } else {
        gql.currentProject.cloudProject = null
      }
    },
    render (gql) {
      _gql = gql

      return (
        <div>
          <div class={[withDefaults.initialNavExpandedVal ? 'w-248px' : 'w-64px', 'transition-all', 'h-screen', 'grid', 'grid-rows-1']}>
            <SidebarNavigation gql={gql} isLoading={withDefaults.isLoading} online={withDefaults.online}/>
          </div>
        </div>
      )
    },
  })
}

describe('SidebarNavigation', () => {
  it('expands the bar when clicking the expand button', { viewportWidth: 1280 }, () => {
    mountComponent()

    cy.findByText('test-project').should('not.be.visible')
    cy.findByLabelText(defaultMessages.sidebar.toggleLabel.collapsed, {
      selector: 'button',
    }).click()

    cy.findByLabelText(defaultMessages.sidebar.toggleLabel.expanded, {
      selector: 'button',
    })

    cy.findByText('test-project').should('be.visible')
    cy.findByTestId('sidebar-link-specs-page').should('have.class', 'router-link-active') // assert active link to prevent percy flake
    cy.percySnapshot()
  })

  it('automatically collapses when viewport decreases < 1024px', () => {
    cy.viewport(1280, 1000)
    mountComponent()

    // Collapsed by default
    cy.findByText('test-project').should('not.be.visible')

    // Expand
    cy.findByLabelText(defaultMessages.sidebar.toggleLabel.collapsed, {
      selector: 'button',
    }).click()

    // Verify expanded - project title should display
    cy.findByText('test-project').should('be.visible')

    // Shrink viewport, should collapse
    cy.viewport(1000, 1000)

    // Project title should not be visible anymore
    cy.findByText('test-project').should('not.be.visible')
    // Expand control should not be available
    cy.findByLabelText(defaultMessages.sidebar.toggleLabel.collapsed, {
      selector: 'button',
    }).should('not.exist')
  })

  it('shows tooltips on hover', () => {
    mountComponent()
    cy.findByTestId('sidebar-header').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'test-project').should('be.visible')
    cy.findByTestId('sidebar-header').trigger('mouseout')

    cy.findByTestId('sidebar-link-runs-page').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Runs').should('be.visible')
    cy.findByTestId('sidebar-link-runs-page').trigger('mouseout')
    cy.percySnapshot()
  })

  it('opens a modal to switch testing type', { viewportWidth: 1280 }, () => {
    mountComponent()
    cy.findByTestId('sidebar-header').click()
    cy.percySnapshot()
  })

  it('opens a modal to show keyboard shortcuts', () => {
    mountComponent()
    cy.findByTestId('keyboard-modal').should('not.exist')
    cy.findByTestId('keyboard-modal-trigger').focus().type('{enter}')
    cy.findByTestId('keyboard-modal').should('be.visible')
  })

  it('uses exact match for router link active class', () => {
    mountComponent()
    cy.findByTestId('sidebar-link-specs-page').should('have.class', 'router-link-exact-active')
  })

  context('debug status badge', () => {
    it('renders no badge when run status is "NOTESTS"', () => {
      mountComponent({ cloudProject: { status: 'NOTESTS', numFailedTests: 0 } })
      cy.findByTestId('debug-badge').should('not.exist')
    })

    it('renders passing badge if run status is "RUNNING" with no failures', () => {
      mountComponent({ cloudProject: { status: 'RUNNING', numFailedTests: 0 } })
      cy.findByLabelText('Relevant run is passing').should('be.visible').contains('0')
      cy.percySnapshot('Debug Badge:failed:single-digit')
    })

    it('renders failure badge if run status is "RUNNING" with failures', () => {
      mountComponent({ cloudProject: { status: 'RUNNING', numFailedTests: 3 } })
      cy.findByLabelText('Relevant run is failing with 3 test failures').should('be.visible')
      cy.percySnapshot('Debug Badge:failed:single-digit')
    })

    it('renders no badge if no cloudProject', () => {
      mountComponent()
      cy.findByLabelText('New Debug feature').should('not.exist')
    })

    it('renders success badge when status is "PASSED"', () => {
      mountComponent({ cloudProject: { status: 'PASSED', numFailedTests: 0 } })
      cy.findByLabelText('Relevant run passed').should('be.visible').contains('0')
      cy.percySnapshot('Debug Badge:passed')
    })

    it('renders failure badge', () => {
      mountComponent({ cloudProject: { status: 'FAILED', numFailedTests: 1 } })
      cy.findByLabelText('Relevant run had 1 test failure').should('be.visible').contains('1')
      cy.percySnapshot('Debug Badge:failed:single-digit')

      mountComponent({ cloudProject: { status: 'FAILED', numFailedTests: 10 } })
      cy.findByLabelText('Relevant run had 10 test failures').should('be.visible').contains('10')
      cy.percySnapshot('Debug Badge:failed:double-digit')

      mountComponent({ cloudProject: { status: 'FAILED', numFailedTests: 100 } })
      cy.findByLabelText('Relevant run had 100 test failures').should('be.visible').contains('99+')
      cy.percySnapshot('Debug Badge:failed:truncated')
    })

    it('renders failure badge when failing tests and abnormal status', () => {
      for (const status of ['CANCELLED', 'ERRORED', 'OVERLIMIT', 'TIMEDOUT'] as CloudRunStatus[]) {
        cy.log(status)
        mountComponent({ cloudProject: { status, numFailedTests: 4 } })
        cy.findByLabelText('Relevant run had an error with 4 test failures').should('be.visible').contains('4')
      }
    })

    it('renders error badge when no tests and abnormal status', () => {
      for (const status of ['CANCELLED', 'ERRORED', 'OVERLIMIT', 'TIMEDOUT'] as CloudRunStatus[]) {
        cy.log(status)
        mountComponent({ cloudProject: { status, numFailedTests: 0 } })
        cy.findByLabelText('Relevant run had an error').should('be.visible').contains('0')
      }

      cy.percySnapshot('Debug Badge:errored')
    })

    it('renders no badge when query is loading', () => {
      const loginConnectStore = useLoginConnectStore()

      loginConnectStore.setProjectFlag('isProjectConnected', true)

      mountComponent({ isLoading: true })

      cy.findByTestId('debug-badge').should('not.exist')
    })

    it('renders no badge if offline', () => {
      mountComponent({ online: false })

      cy.findByTestId('debug-badge').should('not.exist')
    })
  })
})
