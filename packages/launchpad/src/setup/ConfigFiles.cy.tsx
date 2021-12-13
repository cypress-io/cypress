import {
  ConfigFilesFragmentDoc,
} from '../generated/graphql-test'
import ConfigFiles from './ConfigFiles.vue'

describe('<ConfigFile />', () => {
  beforeEach(() => {
    cy.mountFragment(ConfigFilesFragmentDoc, {
      render: (qgl) => {
        return (
          <div>
            <ConfigFiles gql={qgl} />
          </div>
        )
      },
    })
  })

  it('playground', () => {
    cy.contains('button', 'Continue').should('exist')
  })
})
