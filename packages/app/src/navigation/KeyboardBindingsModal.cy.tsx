import KeyboardBindingsModal from './KeyboardBindingsModal.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

const setPlatformConfig = (platform: string) => {
  return cy.window().then((win) => {
    // @ts-ignore
    win.__CYPRESS_CONFIG__ = {
      base64Config: Cypress.Buffer.from(JSON.stringify({ platform })).toString('base64'),
    }
  })
}

describe('KeyboardBindingsModal', () => {
  describe('rendering', () => {
    it('renders expected content', () => {
      cy.mount(() => {
        return <KeyboardBindingsModal show />
      })

      const expectedContent = defaultMessages.sidebar.keyboardShortcuts

      Object.values(expectedContent).forEach((text) => {
        cy.contains(text).should('be.visible')
      })
    })

    it('renders all keyboard bindings with their keys', () => {
      cy.mount(() => {
        return <KeyboardBindingsModal show />
      })

      // Check that all keyboard shortcuts are displayed with their keys
      cy.contains(defaultMessages.sidebar.keyboardShortcuts.rerun).should('be.visible')
      cy.contains('r').should('be.visible')

      cy.contains(defaultMessages.sidebar.keyboardShortcuts.stop).should('be.visible')
      cy.contains('s').should('be.visible')

      cy.contains(defaultMessages.sidebar.keyboardShortcuts.toggle).should('be.visible')
      cy.contains('f').should('be.visible')

      cy.contains(defaultMessages.sidebar.keyboardShortcuts.studioSave).should('be.visible')
    })

    it('does not render when show is false', () => {
      cy.mount(() => {
        return <KeyboardBindingsModal show={false} />
      })

      cy.get('[data-cy="keyboard-modal"]').should('not.exist')
    })
  })

  describe('platform-specific keyboard shortcuts', () => {
    it('shows ⌘+s on macOS (darwin)', () => {
      setPlatformConfig('darwin').then(() => {
        cy.mount(() => {
          return <KeyboardBindingsModal show />
        })

        cy.contains(defaultMessages.sidebar.keyboardShortcuts.studioSave).should('be.visible')
        cy.contains('⌘').should('be.visible')
        cy.contains('+').should('be.visible')
        cy.contains('s').should('be.visible')
        cy.contains('Ctrl').should('not.exist')

        cy.percySnapshot()
      })
    })

    it('shows Ctrl+s on Windows', () => {
      setPlatformConfig('win32').then(() => {
        cy.mount(() => {
          return <KeyboardBindingsModal show />
        })

        cy.contains(defaultMessages.sidebar.keyboardShortcuts.studioSave).should('be.visible')
        cy.contains('Ctrl').should('be.visible')
        cy.contains('+').should('be.visible')
        cy.contains('s').should('be.visible')
        cy.contains('⌘').should('not.exist')

        cy.percySnapshot()
      })
    })

    it('shows Ctrl+s on Linux', () => {
      setPlatformConfig('linux').then(() => {
        cy.mount(() => {
          return <KeyboardBindingsModal show />
        })

        cy.contains(defaultMessages.sidebar.keyboardShortcuts.studioSave).should('be.visible')
        cy.contains('Ctrl').should('be.visible')
        cy.contains('+').should('be.visible')
        cy.contains('s').should('be.visible')
        cy.contains('⌘').should('not.exist')
      })
    })

    it('falls back to darwin if platform is not available', () => {
      cy.window().then((win) => {
        // @ts-ignore
        win.__CYPRESS_CONFIG__ = undefined
      }).then(() => {
        cy.mount(() => {
          return <KeyboardBindingsModal show />
        })

        // Should fallback to darwin and show ⌘
        cy.contains('⌘').should('be.visible')
        cy.contains('Ctrl').should('not.exist')
      })
    })
  })

  describe('modal behavior', () => {
    it('emits close event when close button is clicked', () => {
      const closeSpy = cy.stub().as('closeSpy')

      cy.mount(() => {
        return <KeyboardBindingsModal show onClose={closeSpy} />
      })

      cy.get('[data-cy="keyboard-modal"]').should('be.visible')
      cy.findByLabelText('Close').click()
      cy.get('@closeSpy').should('have.been.calledOnce')
    })

    it('emits close event when clicking outside the modal', () => {
      const closeSpy = cy.stub().as('closeSpy')

      cy.mount(() => {
        return <KeyboardBindingsModal show onClose={closeSpy} />
      })

      cy.get('[data-cy="keyboard-modal"]').should('be.visible')
      // Click outside the modal (on the backdrop)
      cy.get('body').click(0, 0)
      cy.get('@closeSpy').should('have.been.calledOnce')
    })
  })
})
