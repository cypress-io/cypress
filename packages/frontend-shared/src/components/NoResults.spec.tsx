import NoResuts from './NoResults.vue'

describe('<NoResults />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div><NoResuts search="hi" /></div>
    ))
  })
})
