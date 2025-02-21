import RunsEmpty from './RunsEmpty.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('RunsEmpty', () => {
  it('renders expected content', () => {
    cy.mount(<RunsEmpty />)

    cy.gqlStub.Query.currentProject = {
      id: 'test_id',
      title: 'project_title',
    } as any

    cy.contains(defaultMessages.runs.empty.title).should('be.visible')
    cy.findByDisplayValue('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
  })
})
