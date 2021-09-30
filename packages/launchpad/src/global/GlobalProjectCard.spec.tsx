import GlobalProjectCard from './GlobalProjectCard.vue'
import { createTestProject } from '@packages/frontend-shared/src/graphql/testStubData'
import { GlobalProjectCard_ProjectFragmentDoc } from '../generated/graphql-test'

describe('<GlobalProjectCard />', () => {
  it('renders', () => {
    const testProject = createTestProject('test-project')

    cy.mountFragment(GlobalProjectCard_ProjectFragmentDoc, {
      type: (ctx) => {
        return { ...ctx.stubData.project }
      },
      render: (gqlValue) => (
        <div class="p-12 overflow-auto resize-x max-w-600px">
          <GlobalProjectCard gql={gqlValue} />
        </div>
      ),
    })

    cy.findByText(testProject.title).should('be.visible')
    cy.findByText(testProject.projectRoot).should('be.visible')
  })
})
