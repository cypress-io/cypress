import GlobalProjectCard from './GlobalProjectCard.vue'
import { GlobalProjectCardFragmentDoc } from '../generated/graphql-test'

describe('<GlobalProjectCard />', () => {
  beforeEach(() => {
    const removeProjectSpy = cy.spy().as('removeProjectSpy')

    cy.mountFragment(GlobalProjectCardFragmentDoc, {
      render: (gqlValue) => (
        <div class="p-12 overflow-auto resize-x max-w-600px">
          <GlobalProjectCard gql={gqlValue} onRemoveProject={removeProjectSpy} />
        </div>
      ),
    })
  })

  it('renders', () => {
    cy.findByText('Some Test Title').should('be.visible')
    cy.findByText('/usr/local/dev/projects/some-test-title').should('be.visible')
  })

  it('emits removeProject event on click', () => {
    cy.get('[data-testid=removeProjectButton]')
    .click()
    .get('@removeProjectSpy').should('have.been.called')
  })
})
