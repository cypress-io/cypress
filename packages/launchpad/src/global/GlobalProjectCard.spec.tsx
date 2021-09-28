import GlobalProjectCard from './GlobalProjectCard.vue'
import { createTestProject } from '@packages/frontend-shared/src/graphql/testStubData'

describe('<GlobalProjectCard />', () => {
  it('renders', () => {
    const testProject = createTestProject('test-project')

    cy.mount(() => <div class="p-12 overflow-auto resize-x max-w-600px"><GlobalProjectCard project={testProject} /></div>)
    cy.findByText(testProject.title).should('be.visible')
    cy.findByText(testProject.projectRoot).should('be.visible')
  })
})
