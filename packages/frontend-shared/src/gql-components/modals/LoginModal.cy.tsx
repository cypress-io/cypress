import { LoginModalFragmentDoc } from '../../generated/graphql-test'
import LoginModal from './LoginModal.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import Tooltip from '../../components/Tooltip.vue'
import { ref } from 'vue'
import { CloudUserStubs } from '@packages/graphql/test/stubCloudTypes'
import { useUserProjectStatusStore } from '../../store'

const text = defaultMessages.topNav

const cloudViewer = {
  id: '1',
  email: 'test@test.test',
  fullName: 'Tester Test',
}

const cloudViewerNoName = {
  id: '2',
  email: 'no.name@test.test',
  fullName: null,
}

type TestCloudViewer = {
  __typename?: 'CloudUser' | undefined
  id: string
  email: string | null
  fullName: string | null
}

const mountSuccess = (viewer: TestCloudViewer = cloudViewer) => {
  const finalViewer = {
    ...CloudUserStubs.me,
    organizations: null,
    firstOrganization: {
      __typename: 'CloudOrganizationConnection' as const,
      nodes: [],
    },
    ...viewer,
  }

  const { setUserFlag } = useUserProjectStatusStore()

  setUserFlag('isLoggedIn', true)
  cy.mountFragment(LoginModalFragmentDoc, {
    onResult: (result) => {
      result.__typename = 'Query'
      result.authState.browserOpened = true
      result.cloudViewer = finalViewer
      result.cloudViewer.__typename = 'CloudUser'
    },
    render: (gqlVal) => (
      <div class="border-current border h-[700px] resize overflow-auto">
        <LoginModal
          gql={gqlVal}
          utmMedium="testing"
        />
      </div>),
  })
}

describe('<LoginModal />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  describe('progress communication', () => {
    it('renders and reaches "opening browser" status', () => {
      cy.mountFragment(LoginModalFragmentDoc, {
        render: (gqlVal) => <div class="border-current border h-[700px] resize overflow-auto"><LoginModal gql={gqlVal} utmMedium="testing" /></div>,
      })

      cy.contains('h2', text.login.titleInitial).should('be.visible')
      cy.contains('a', text.login.cloud).should('be.visible').should('have.attr', 'href', 'https://on.cypress.io/dashboard-introduction')

      // begin the login process
      cy.findByRole('button', { name: text.login.actionLogin }).click()

      // ensure we reach "browser is opening" status on the CTA
      cy.findByRole('button', { name: text.login.actionOpening })
      .should('be.visible')
      .and('be.disabled')
    })

    it('shows correct "waiting for login" status', () => {
      cy.mountFragment(LoginModalFragmentDoc, {
        render: (gqlVal) => {
          gqlVal.authState.browserOpened = true

          return <div class="border-current border h-[700px] resize overflow-auto"><LoginModal gql={gqlVal} utmMedium="testing" /></div>
        },
      })

      // The LoginModal immediately shows the "Waiting..." button
      // if the browser already opened
      cy.findByRole('button', { name: text.login.actionWaiting })
      .should('be.visible')
      .and('be.disabled')
    })

    it('shows successful login status', () => {
      mountSuccess()
      cy.contains('h2', text.login.titleSuccess).should('be.visible')
      cy.contains(text.login.bodySuccess.replace('{0}', cloudViewer.fullName)).should('be.visible')
      cy.contains('a', cloudViewer.fullName).should('have.attr', 'href', 'https://on.cypress.io/dashboard/profile')
    })
  })

  describe('errors', () => {
    it('shows an error state when browser cannot be launched', () => {
      const authUrl = 'http://127.0.0.1:0000/redirect-to-auth'

      cy.mountFragment(LoginModalFragmentDoc, {
        onResult: (result) => {
          result.__typename = 'Query'
          result.authState.name = 'AUTH_COULD_NOT_LAUNCH_BROWSER'
          result.authState.message = 'http://127.0.0.1:0000/redirect-to-auth'
        },
        render: (gqlVal) =>
          (<div class="border-current border h-[700px] resize overflow-auto">
            <LoginModal gql={gqlVal} utmMedium="testing"/>
          </div>),
      })

      cy.contains('button', text.login.actionTryAgain).should('not.be.visible')
      cy.contains('button', text.login.actionCancel).should('not.be.visible')
      cy.contains(text.login.titleBrowserError).should('be.visible')
      cy.contains(text.login.bodyBrowserError).should('be.visible')
      cy.contains(text.login.bodyBrowserErrorDetails).should('be.visible')
      cy.contains(authUrl).should('be.visible')
      cy.contains('button', 'Copy').should('be.visible')
    })

    it('shows non-browser errors from login process', () => {
      const cancelSpy = cy.spy().as('cancelSpy')
      const errorText = 'The flux capacitor ran out of battery'

      cy.mountFragment(LoginModalFragmentDoc, {
        render: (gqlVal) => {
          gqlVal.authState.name = 'AUTH_ERROR_DURING_LOGIN'
          gqlVal.authState.message = errorText

          return (<div class="border-current border h-[700px] resize overflow-auto">
            <LoginModal gql={gqlVal} onCancel={cancelSpy} utmMedium="testing"/>
          </div>)
        },
      })

      cy.contains(text.login.titleFailed).should('be.visible')
      cy.contains(text.login.bodyError).should('be.visible')
      cy.contains(errorText).should('be.visible')

      // we test the qql mutation behavior of these buttons from e2e tests
      cy.contains('button', text.login.actionTryAgain).should('be.visible')

      // but we can test that cancelling closes the modal here:
      cy.contains('button', text.login.actionCancel).click()
      cy.get('@cancelSpy').should('have.been.called')
    })
  })

  it('shows successful login status with email if name not provided', () => {
    mountSuccess(cloudViewerNoName)
    cy.contains('h2', text.login.titleSuccess).should('be.visible')
    cy.contains(text.login.bodySuccess.replace('{0}', cloudViewerNoName.email)).should('be.visible')
    cy.contains('a', cloudViewerNoName.email).should('have.attr', 'href', 'https://on.cypress.io/dashboard/profile')
  })

  it('emits an event to close the modal when "Continue" button is clicked', () => {
    mountSuccess()
    cy.findByRole('button', { name: text.login.actionContinue }).click().then(() => {
      cy.wrap(Cypress.vueWrapper.findComponent(LoginModal).emitted('close'))
      .should('have.length', 1)
    })
  })

  describe('no internet connection', () => {
    afterEach(() => {
      cy.goOnline()
    })

    it('renders correct components if there is no internet connection', () => {
      cy.mountFragment(LoginModalFragmentDoc, {
        render: (gqlVal) => <div class="border-current border h-[700px] resize overflow-auto"><LoginModal gql={gqlVal} utmMedium="testing"/></div>,
      })

      cy.goOffline()

      cy.contains('You have no internet connection')
      cy.findByRole('button', { name: text.login.actionLogin })
      .should('be.visible')
      .and('be.disabled')
    })

    it('shows login action when the internet is back', () => {
      cy.mountFragment(LoginModalFragmentDoc, {
        render: (gqlVal) => <div class="border-current border h-[700px] resize overflow-auto"><LoginModal gql={gqlVal} utmMedium="testing"/></div>,
      })

      cy.goOffline()

      cy.contains('You have no internet connection')
      cy.findByRole('button', { name: text.login.actionLogin })
      .should('be.visible')
      .and('be.disabled')

      cy.goOnline()

      cy.contains('h2', text.login.titleInitial).should('be.visible')

      // begin the login process
      cy.findByRole('button', { name: text.login.actionLogin }).click()

      // ensure we reach "browser is opening" status on the CTA
      cy.findByRole('button', { name: text.login.actionOpening })
      .should('be.visible')
      .and('be.disabled')
    })
  })

  it('automatically closes tooltips on open', () => {
    const tooltipSlots = {
      default: () => <div data-cy="tooltip-trigger">Trigger</div>,
      popper: () => <div data-cy="tooltip-content">Tooltip Content</div>,
    }
    const isOpen = ref(false)

    cy.mountFragment(LoginModalFragmentDoc, {
      render: (gqlVal) => {
        gqlVal.authState.browserOpened = true

        return (
          <div>
            <Tooltip v-slots={tooltipSlots} isInteractive />
            {isOpen.value && <LoginModal gql={gqlVal} utmMedium="testing" />}
          </div>
        )
      },
    })

    // Open tooltip
    cy.findByTestId('tooltip-trigger').trigger('mouseenter')

    // Wait for tooltip to be visible
    cy.findByTestId('tooltip-content')
    .should('be.visible')
    .then(() => {
      // Open modal
      isOpen.value = true
    })

    // Verify tooltip is no longer open once modal was opened
    cy.findByTestId('tooltip-content')
    .should('not.exist')

    cy.percySnapshot()
  })
})
