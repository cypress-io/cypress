import KeyboardBindingsModal from './KeyboardBindingsModal.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('KeyboardBindingsModal', () => {
  it('renders expected content', () => {
    cy.mount(() => {
      return <KeyboardBindingsModal show />
    })

    const expectedContent = defaultMessages.sidebar.keyboardShortcuts

    Object.values(expectedContent).forEach((text) => {
      cy.contains(text).should('be.visible')
    })
  })
})
