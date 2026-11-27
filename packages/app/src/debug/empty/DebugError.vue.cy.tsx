import DebugError from './DebugError.vue'

describe('<DebugError />', () => {
  it('can mount', () => {
    cy.mount(<DebugError />)
    cy.contains('Git repository not detected')
    cy.contains('Cypress uses Git to associate runs with your local state. Please ensure that Git is properly configured for your project.')
  })
})
