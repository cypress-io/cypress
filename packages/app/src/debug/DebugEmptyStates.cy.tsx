import DebugNotLoggedIn from './DebugNotLoggedIn.vue'

describe('Debug page empty states', () => {
  context('not logged in', () => {
    it('renders correctly', () => {
      cy.mount(<DebugNotLoggedIn />)
    })
  })
})
