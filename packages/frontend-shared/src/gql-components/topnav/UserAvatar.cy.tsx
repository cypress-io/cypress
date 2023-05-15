import UserAvatar from './UserAvatar.vue'

describe('<UserAvatar />', { viewportWidth: 48, viewportHeight: 48 }, () => {
  it('renders when an email address is passed', () => {
    cy.mount(() => <UserAvatar email="test@test.test" class="h-[48px] w-[48px]"/>)
    validateUserAvatar()
    cy.percySnapshot()
  })

  it('renders when a null email address is passed', () => {
    cy.mount(() => <UserAvatar email={null} class="h-[50px] w-[50px]"/>)
    validateUserAvatar()
  })

  it('renders when no email address is passed', () => {
    cy.mount(() => <UserAvatar class="h-[50px] w-[50px]"/>)
    validateUserAvatar()
  })

  function validateUserAvatar () {
    cy.get('[data-cy="user-avatar"]')
    .should('be.visible')
    .should(($el) => {
    // general health check that that gravatar url was used in the DOM,
    // since it does not contain explicit parameters like email address to check
      expect($el[0].outerHTML).to.contain('gravatar.com/avatar')
    })
  }
})
