import NotificationSettings from './NotificationSettings.vue'
import { NotificationSettingsFragmentDoc } from '../../generated/graphql-test'

function assertFormControls (assertion: 'be.disabled' | 'not.be.disabled') {
  cy.findByTestId('send-test-notification').should(assertion)
  cy.get('input#passed').should(assertion)
  cy.get('input#failed').should(assertion)
  cy.get('input#cancelled').should(assertion)
  cy.get('input#errored').should(assertion)
  cy.get('button#notifyWhenRunStarts').should(assertion)
  cy.get('button#notifyWhenRunStartsFailing').should(assertion)
}

describe('NotificationSettings', () => {
  it('renders', () => {
    cy.mountFragment(NotificationSettingsFragmentDoc, {
      render (gql) {
        return (<NotificationSettings gql={gql} />)
      },
    })

    cy.percySnapshot()
  })

  it('renders a banner and disables form when notifications are not enabled', () => {
    cy.mountFragment(NotificationSettingsFragmentDoc, {
      onResult: (gql) => {
        gql.localSettings.preferences.desktopNotificationsEnabled = null
      },
      render (gql) {
        return (<NotificationSettings gql={gql} />)
      },
    })

    cy.findByTestId('enable-notifications').should('exist')
    cy.findByTestId('send-test-notification').should('be.disabled')
    assertFormControls('be.disabled')
  })

  it('does not render a banner when notifications are enabled', () => {
    cy.mountFragment(NotificationSettingsFragmentDoc, {
      onResult: (gql) => {
        gql.localSettings.preferences.desktopNotificationsEnabled = true
      },
      render (gql) {
        return (<NotificationSettings gql={gql} />)
      },
    })

    cy.findByTestId('enable-notifications').should('not.exist')
    assertFormControls('not.be.disabled')
  })
})
