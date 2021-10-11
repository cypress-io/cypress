import { LoginModalFragmentDoc } from '../../generated/graphql-test'
import LoginModal from './LoginModal.vue'
import { defaultMessages } from '@cy/i18n'

const text = defaultMessages.topNav

const cloudViewer = {
  id: '1',
  email: 'test@test.test',
  fullName: 'Tester Test',
}

const mountSuccess = () => {
  cy.mountFragment(LoginModalFragmentDoc, {
    onResult: (result) => {
      result.__typename = 'Query'
      result.app.isAuthBrowserOpened = true
      result.cloudViewer = cloudViewer
      result.cloudViewer.__typename = 'CloudUser'
    },
    render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><LoginModal gql={gqlVal} modelValue={true} /></div>,
  })
}

describe('<LoginModal />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders and reaches "opening browser" status', () => {
    cy.mountFragment(LoginModalFragmentDoc, {
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><LoginModal gql={gqlVal} modelValue={true} /></div>,
    })

    cy.contains('h2', text.login.titleInitial).should('be.visible')

    // begin the login process
    cy.findByRole('button', { name: text.login.actionLogin }).click()

    // ensure we reach "browser is opening" status on the CTA
    cy.findByRole('button', { name: text.login.actionOpening })
    .should('be.visible')
    .and('be.disabled')
  })

  it('shows correct "waiting for login" status', () => {
    cy.mountFragment(LoginModalFragmentDoc, {
      onResult: (result) => {
        result.__typename = 'Query'
        result.app.isAuthBrowserOpened = true
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><LoginModal gql={gqlVal} modelValue={true} /></div>,
    })

    cy.findByRole('button', { name: text.login.actionLogin }).click()

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

  it('emits an event to close the modal when "Continue" button is clicked', () => {
    mountSuccess()
    cy.findByRole('button', { name: text.login.actionContinue }).click().then(async () => {
      cy.wrap(Cypress.vueWrapper.findComponent(LoginModal).emitted('update:modelValue')?.[0])
      .should('deep.equal', [false])
    })
  })
})
