import RunsConnect from './RunsConnect.vue'

const gql = {
  app: {
    isAuthBrowserOpened: true,
  },
  cloudViewer: {
    id: '2',
    email: 't@me.com',
    fullName: 'John Appleseed',
  },
}

describe('<RunsConnect />', () => {
  it('playground', () => {
    cy.mount(<RunsConnect isLoggedIn={false} gql={gql} />)
  })

  it('show user connect if not connected', () => {
    cy.mount(<RunsConnect isLoggedIn={false} gql={gql}/>)
    cy.contains('button', 'Log in').should('be.visible')
  })

  it('show project connect if not connected', () => {
    cy.mount(<RunsConnect isLoggedIn={true} gql={gql}/>)
    cy.contains('button', 'Connect your project').should('be.visible')
  })
})
