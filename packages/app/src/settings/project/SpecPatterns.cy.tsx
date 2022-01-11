import SpecPatterns from './SpecPatterns.vue'

describe('<SpecPatterns />', () => {
  beforeEach(() => {
    cy.viewport(1000, 600)
  })

  it('renders the SpecPatterns', () => {
    cy.mount(<SpecPatterns />)
  })
})
