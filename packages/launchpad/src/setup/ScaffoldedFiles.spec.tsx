import {
  ConfigFilesFragmentDoc,
} from '../generated/graphql-test'
import ScaffoldedFiles from './ScaffoldedFiles.vue'

describe('<ScaffoldedFiles />', () => {
  beforeEach(() => {
    cy.mountFragment(ConfigFilesFragmentDoc, {
      render: (qgl) => {
        return (
          <div>
            <ScaffoldedFiles gql={qgl} />
          </div>
        )
      },
    })
  })

  it('playground', () => {
    cy.contains('button', 'Continue').should('exist')
  })
})
