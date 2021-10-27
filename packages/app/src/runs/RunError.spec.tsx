import RunError from './RunError.vue'

describe('<RunError />', () => {
  it('playground', () => {
    cy.mount(<RunError error="abc123" />)
  })
})
