import Greeting from './Greeting.vue'

describe('mount command from a .jsx support file', () => {
  it('renders the component through Vue JSX', () => {
    cy.mount(Greeting, { props: { name: 'Ada Lovelace' } })

    cy.get('.wrap .greeting').should('have.text', 'Hello, Ada Lovelace!')
  })
})
