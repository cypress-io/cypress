import SidebarNavigation from './SidebarNavigation.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { CloudRunStatus, SidebarNavigationFragment, SidebarNavigationFragmentDoc, SideBarNavigation_SetPreferencesDocument } from '../generated/graphql-test'
import { CloudRunStubs } from '@packages/graphql/test/stubCloudTypes'
import { cloneDeep } from 'lodash'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

function mountComponent (props: { initialNavExpandedVal?: boolean, cloudProject?: { status: CloudRunStatus, numFailedTests: number }, latestCloudProject?: { status: CloudRunStatus, numFailedTests: number }, isLoading?: boolean, online?: boolean} = {}) {
  const withDefaults = { initialNavExpandedVal: false, isLoading: false, online: true, ...props }
  let _gql: SidebarNavigationFragment

  cy.stubMutationResolver(SideBarNavigation_SetPreferencesDocument, (defineResult) => {
    _gql.localSettings.preferences.isSideNavigationOpen = !_gql.localSettings.preferences.isSideNavigationOpen

    return defineResult({ setPreferences: _gql })
  })

  const selectedVariables = withDefaults.cloudProject ? {
    selectedRunNumber: 1,
    hasSelectedRun: true,
  } : {
    selectedRunNumber: -1,
    hasSelectedRun: false,
  }

  const latestVariables = withDefaults.latestCloudProject ? {
    latestRunNumber: 1,
    hasLatestRun: true,
  } : {
    latestRunNumber: -1,
    hasLatestRun: false,
  }

  cy.mountFragment(SidebarNavigationFragmentDoc, {
    variableTypes: {
      selectedRunNumber: 'Int',
      hasSelectedRun: 'Boolean',
      latestRunNumber: 'Int',
      hasLatestRun: 'Boolean',
    },
    variables: {
      ...selectedVariables,
      ...latestVariables,
    },
    onResult (gql) {
      if (!gql.currentProject) return

      if (gql.currentProject?.cloudProject?.__typename === 'CloudProject') {
        if (withDefaults.cloudProject) {
          gql.currentProject.cloudProject.selectedRun = cloneDeep(CloudRunStubs.failingWithTests)
          gql.currentProject.cloudProject.selectedRun.status = withDefaults.cloudProject.status as CloudRunStatus
          gql.currentProject.cloudProject.selectedRun.totalFailed = withDefaults.cloudProject.numFailedTests
        }

        if (withDefaults.latestCloudProject) {
          gql.currentProject.cloudProject.latestRun = cloneDeep(CloudRunStubs.failingWithTests)
          gql.currentProject.cloudProject.latestRun.status = withDefaults.latestCloudProject.status as CloudRunStatus
          gql.currentProject.cloudProject.latestRun.totalFailed = withDefaults.latestCloudProject.numFailedTests
        }
      } else {
        gql.currentProject.cloudProject = null
      }
    },
    render (gql) {
      _gql = gql

      return (
        <div>
          <div class={[withDefaults.initialNavExpandedVal ? 'w-[248px]' : 'w-[64px]', 'transition-all', 'h-screen', 'grid', 'grid-rows-1']}>
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
    cy.findByTestId('sidebar-link-specs-page').should('be.visible').should('have.class', 'router-link-active').contains('Specs') // assert active link to prevent percy flake
    cy.findAllByTestId('sidebar-link-runs-page').should('be.visible').should('not.have.class', 'router-link-active').contains('Runs')
    cy.findAllByTestId('sidebar-link-debug-page').should('be.visible').should('not.have.class', 'router-link-active').contains('Debug')
    cy.findAllByTestId('sidebar-link-settings-page').should('be.visible').should('not.have.class', 'router-link-active').contains('Settings')
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

    cy.findByTestId('sidebar-link-specs-page').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Specs').should('be.visible')
    cy.findByTestId('sidebar-link-specs-page').trigger('mouseout')

    cy.findByTestId('sidebar-link-runs-page').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Runs').should('be.visible')
    cy.findByTestId('sidebar-link-runs-page').trigger('mouseout')

    cy.findByTestId('sidebar-link-debug-page').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Debug').should('be.visible')
    cy.findByTestId('sidebar-link-debug-page').trigger('mouseout')

    cy.findByTestId('sidebar-link-settings-page').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Settings').should('be.visible')
    cy.findByTestId('sidebar-link-settings-page').trigger('mouseout')
  })

  it('opens a modal to switch testing type', { viewportWidth: 1280 }, () => {
    mountComponent()
    cy.findByTestId('sidebar-header').click()
    cy.get('button').contains('E2E Testing')
    cy.contains('p', 'Build and test the entire experience of your application from end-to-end to ensure each flow matches your expectations.')
    cy.get('button').contains('Component Testing')
    cy.contains('p', 'Build and test your components from your design system in isolation in order to ensure each state matches your expectations.')
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
      cy.percySnapshot('Debug Badge:passed:single-digit')
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
    })

    it('renders failure badge', () => {
      mountComponent({ cloudProject: { status: 'FAILED', numFailedTests: 1 } })
      cy.findByLabelText('Relevant run had 1 test failure').should('be.visible').contains('1')

      mountComponent({ cloudProject: { status: 'FAILED', numFailedTests: 10 } })
      cy.findByLabelText('Relevant run had 10 test failures').should('be.visible').contains('10')

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
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setProjectFlag('isProjectConnected', true)

      mountComponent({ isLoading: true })

      cy.findByTestId('debug-badge').should('not.exist')
    })

    it('renders no badge if offline', () => {
      mountComponent({ online: false })

      cy.findByTestId('debug-badge').should('not.exist')
    })
  })

  context('runs status icon', () => {
    it('renders passing status if run status is "RUNNING" with no failures', () => {
      mountComponent({ latestCloudProject: { status: 'RUNNING', numFailedTests: 0 } })
      cy.findByTestId('icon-status-message').should('be.visible').contains('Latest run is in progress')
      cy.percySnapshot('Runs Icon:running')
    })

    it('renders failing status if run status is "RUNNING" with failures', () => {
      mountComponent({ latestCloudProject: { status: 'RUNNING', numFailedTests: 3 } })
      cy.findByTestId('icon-status-message').should('be.visible').contains('failing')
      cy.percySnapshot('Runs Icon:failing')
    })

    it('renders success status when status is "PASSED"', () => {
      mountComponent({ latestCloudProject: { status: 'PASSED', numFailedTests: 0 } })
      cy.findByTestId('icon-status-message').should('be.visible').contains('Latest run passed')
      cy.percySnapshot('Runs Icon:passed')
    })

    it('renders failed status when status is "FAILED"', () => {
      mountComponent({ latestCloudProject: { status: 'FAILED', numFailedTests: 1 } })
      cy.findByTestId('icon-status-message').should('be.visible').contains('Latest run had 1 test failure')
      cy.percySnapshot('Runs Icon:failed')
    })

    it('renders cancelled status when status is "CANCELLED"', () => {
      mountComponent({ latestCloudProject: { status: 'CANCELLED', numFailedTests: 0 } })
      cy.findByTestId('icon-status-message').should('be.visible').contains('Latest run has been cancelled')
      cy.percySnapshot('Runs Icon:cancelled')
    })

    it('renders attention status when abnormal status', () => {
      for (const status of ['ERRORED', 'NOTESTS', 'OVERLIMIT', 'TIMEDOUT'] as CloudRunStatus[]) {
        cy.log(status)
        mountComponent({ latestCloudProject: { status, numFailedTests: 0 } })
        cy.findByTestId('icon-status-message').should('be.visible').contains('Latest run had an error')
      }

      cy.percySnapshot('Runs Icon:errored')
    })

    it('renders attention status when abnormal status and failing tests', () => {
      for (const status of ['ERRORED', 'NOTESTS', 'OVERLIMIT', 'TIMEDOUT'] as CloudRunStatus[]) {
        cy.log(status)
        mountComponent({ latestCloudProject: { status, numFailedTests: 3 } })
        cy.findByTestId('icon-status-message').should('be.visible').contains('Latest run had an error with 3 test failures')
      }
    })

    it('renders no status if no cloudProject', () => {
      mountComponent()
      cy.findByTestId('icon-status-message').should('not.exist')
    })

    it('renders no status when query is loading', () => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setProjectFlag('isProjectConnected', true)

      mountComponent({ isLoading: true })

      cy.findByTestId('icon-status-message').should('not.exist')
    })

    it('renders no status if offline', () => {
      mountComponent({ online: false })

      cy.findByTestId('icon-status-message').should('not.exist')
    })
  })
})
