import KeyboardBindingsModal from './KeyboardBindingsModal.vue'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mount(() => {
      return <KeyboardBindingsModal show />
    })
  })
})
