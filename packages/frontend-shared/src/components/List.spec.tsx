import List from './List.vue'

describe('<List />', () => {
  it('renders', () => {
    cy.mount(() => <List/>)
  })
})
