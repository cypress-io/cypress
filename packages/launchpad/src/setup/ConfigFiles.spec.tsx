import ConfigFiles from './ConfigFiles.vue'

describe('<ConfigFile />', () => {
  beforeEach(() => {
    cy.mount(<ConfigFiles />)
  })

  it('playground', () => {
    cy.contains('button', 'Continue').should('exist')
  })
})
