import GlobalProjectCard from './GlobalProjectCard.vue'
import { createTestProject } from '@packages/frontend-shared/src/graphql/testStubData'
import { GlobalProjectCard_ProjectFragmentDoc } from '../generated/graphql-test'

describe('<GlobalProjectCard />', () => {
  beforeEach(() => {
    const removeProjectSpy = cy.spy().as('removeProjectSpy')

    cy.mountFragment(GlobalProjectCard_ProjectFragmentDoc, {
      type: (ctx) => {
        return { ...ctx.stubData.project }
      },
      render: (gqlValue) => (
        <div class="p-12 overflow-auto resize-x max-w-600px">
          <GlobalProjectCard gql={gqlValue} onRemoveProject={removeProjectSpy} />
        </div>
      ),
    })
  })

  it('renders', () => {
    const testProject = createTestProject('test-project')

    cy.findByText(testProject.title).should('be.visible')
    cy.findByText(testProject.projectRoot).should('be.visible')
  })

  it('emits removeProject event on click', () => {
    cy.get('[data-testid=removeProjectButton]')
    .click()
    .get('@removeProjectSpy').should('have.been.called')
  })
})
