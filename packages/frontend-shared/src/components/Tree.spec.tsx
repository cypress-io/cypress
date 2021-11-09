import Tree from './Tree.vue'

describe('<Tree />', () => {
  it('renders', () => {
    cy.mount(() => <Tree/>)
  })
})
