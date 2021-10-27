import RunsConnect from './RunsConnect.vue'

describe('<RunsConnect />', () => {
  it('playground', () => {
    cy.mount(<RunsConnect isLoggedIn={false} hasProjectId={false} />)
  })
})
