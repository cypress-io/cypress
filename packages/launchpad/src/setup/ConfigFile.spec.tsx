// TODO: Why is this failing on CI?

import {
  ConfigFileFragmentDoc,
} from '../generated/graphql-test'
import ConfigFile from './ConfigFile.vue'

// TODO: failing on CI. Find out why.
describe('<ConfigFile />', () => {
  beforeEach(() => {
    cy.mountFragment(ConfigFileFragmentDoc, {
      render: (gql) => {
        return (
          <div>
            <ConfigFile gql={gql} />
          </div>
        )
      },
    })
  })

  it('playground', { viewportWidth: 1280, viewportHeight: 1024 }, () => {
    cy.contains('button', 'JavaScript').click()
  })

  it('should display a copy button when in manual mode', () => {
    cy.contains('Copy').should('not.exist')
    cy.contains('Create file manually').click()
    cy.contains('Copy').should('exist')
  })
})
