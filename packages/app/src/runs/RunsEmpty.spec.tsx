import RunsEmpty from './RunsEmpty.vue'

describe('<RunsEmpty />', () => {
  it('playground', () => {
    cy.mount(<RunsEmpty projectId="abc123" />)
  })
})
