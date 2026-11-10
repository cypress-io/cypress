import RunsEmpty from './RunsEmpty.vue'

describe('RunsEmpty', () => {
  it('renders expected content', () => {
    cy.mount(<RunsEmpty />)

    cy.gqlStub.Query.currentProject = {
      id: 'test_id',
      title: 'project_title',
    } as any

    cy.contains('Copy the command below to record your first run').should('be.visible')
    cy.findByDisplayValue('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
  })
})
