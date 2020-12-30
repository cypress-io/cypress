cy.defineSession('user', () => {
  cy.visit('http://localhost:3000/login?user=user1')
  cy.get('input:first').type('user')
  cy.get('input[type=password]').type('pass')
  cy.get('button').click()

  cy.contains('success')
})

// const login = () => {
//   cy.visit('http://localhost:3000/login?user=user1')
//   cy.get('input:first').type('user')
//   cy.get('input[type=password]').type('pass')
//   cy.get('button').click()

//   cy.contains('success')
// }

describe('suite', () => {
  beforeEach(() => {
    // login()
    cy.useSession('user')
    cy.visit('http://localhost:3000/home')
  })

  it('test one', () => {
    cy.contains('welcome')
  })

  it('test two', () => {
    cy.contains('welcome')
  })

  it('test three', () => {
    cy.contains('welcome')
  })

  it('test four', () => {
    cy.contains('welcome')
  })

  it('test five', () => {
    cy.contains('welcome')
  })

  it('test six', () => {
    cy.contains('welcome')
  })
})
