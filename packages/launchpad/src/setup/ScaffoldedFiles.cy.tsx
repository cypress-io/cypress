import {
  ScaffoldedFilesFragmentDoc,
} from '../generated/graphql-test'
import ScaffoldedFiles from './ScaffoldedFiles.vue'

describe('<ScaffoldedFiles />', () => {
  beforeEach(() => {
    cy.mountFragment(ScaffoldedFilesFragmentDoc, {
      render: (gql) => {
        return (
          <div>
            <ScaffoldedFiles gql={gql} />
          </div>
        )
      },
    })
  })

  it('playground', () => {
    cy.contains('button', 'Continue').should('exist')
  })
})
