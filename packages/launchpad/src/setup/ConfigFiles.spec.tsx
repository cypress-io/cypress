import {
  ConfigFilesDocument,
} from '../generated/graphql-test'
import ConfigFiles from './ConfigFiles.vue'

// TODO: failing on CI. Find out why.
describe('<ConfigFile />', () => {
  beforeEach(() => {
    cy.mountFragment(ConfigFilesDocument, {
      render: () => {
        return (
          <div>
            <ConfigFiles />
          </div>
        )
      },
    })
  })

  it('playground', () => {
    cy.contains('button', 'Continue').should('exist')
  })
})
