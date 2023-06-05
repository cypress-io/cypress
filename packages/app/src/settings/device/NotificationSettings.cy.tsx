import NotificationSettings from './NotificationSettings.vue'
import { NotificationSettingsFragmentDoc } from '../../generated/graphql-test'

describe('NotificationSettings', () => {
  it('renders', () => {
    cy.mountFragment(NotificationSettingsFragmentDoc, {
      render (gql) {
        return (<NotificationSettings gql={gql} />)
      },
    })

    cy.percySnapshot()
  })
})
