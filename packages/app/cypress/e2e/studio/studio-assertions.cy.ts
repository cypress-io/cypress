import { launchStudio } from './helper'

describe('Cypress Studio - Assertions and Right-Click Menu', () => {
  it('updates an existing test with assertions', () => {
    launchStudio()

    cy.waitForSpecToFinish()

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be enabled').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('be.enabled');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('be visible').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('be.visible');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have text').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('Increment').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('have.text', 'Increment');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have id').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('increment').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('have.id', 'increment');`)

    cy.getAutIframe().within(() => {
      cy.get('#increment').rightclick().then(() => {
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('have attr').realHover()
        cy.get('.__cypress-studio-assertions-menu').shadow().contains('onclick').realClick()
      })
    })

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').should('have.attr', 'onclick', 'increment()');`)

    cy.get('[data-cy="studio-save-button"]').click()

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('#increment').should('be.enabled');
    cy.get('#increment').should('be.visible');
    cy.get('#increment').should('have.text', 'Increment');
    cy.get('#increment').should('have.id', 'increment');
    cy.get('#increment').should('have.attr', 'onclick', 'increment()');
  })
})`.trim())
    })
  })

  describe('assertions menu', () => {
    const showAssertionsMenu = (autAssertions?: () => void) => {
      launchStudio()

      cy.waitForSpecToFinish()

      cy.contains('No commands were issued in this test.').should('not.exist')

      cy.getAutIframe().within(() => {
        // Show menu
        cy.get('h1').realClick({
          button: 'right',
        })

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertions-menu').should('be.visible')

        // Show submenu
        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-type-text:first').realHover()

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-option')
        .should('have.text', 'Hello, Studio!')
        .should('be.visible')

        autAssertions?.()
      })
    }

    const showAssertionsMenuForModal = (autAssertions?: () => void) => {
      launchStudio({ specName: 'spec-w-modal.cy.js' })

      cy.waitForSpecToFinish()

      cy.contains('No commands were issued in this test.').should('not.exist')

      cy.getAutIframe().within(() => {
        // Show menu
        cy.get('.modal-body').realClick({
          button: 'right',
        })

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertions-menu').should('be.visible')

        // Show submenu
        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-type-text:first').realHover()

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-option')
        .should('have.text', 'Semi-transparent background overlay')
        .should('be.visible')

        autAssertions?.()
      })
    }

    const assertionsMenuFns = [
      { fn: showAssertionsMenu, name: 'handles normal element' },
      { fn: showAssertionsMenuForModal, name: 'handles high z-index modal' },
    ]

    assertionsMenuFns.forEach(({ fn, name }) => {
      it(`${name} - shows assertions menu and submenu correctly`, () => {
        fn()
      })

      it(`${name} - closes assertions menu when clicking outside`, () => {
        fn(() => {
          // click outside the menu
          cy.get('.__cypress-studio-assertions-menu').shadow().find('.vue-container').click()
          // check that the menu is closed
          cy.get('.__cypress-studio-assertions-menu').should('not.exist')
        })
      })

      it(`${name} - closes assertions menu on the highlighted element`, () => {
        fn(() => {
          // click on the highlighted element
          cy.get('.__cypress-studio-assertions-menu').shadow().find('.highlight').click()
          // check that the menu is closed
          cy.get('.__cypress-studio-assertions-menu').should('not.exist')
        })
      })
    })

    it('shows the assertions menu for an element inside an invisible wrapper', () => {
      launchStudio({ specName: 'spec-w-invisible-wrapper.cy.js' })

      cy.getAutIframe().within(() => {
        // Show menu
        cy.contains('Increment').realClick({
          button: 'right',
        })

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertions-menu').should('be.visible').then(($el) => {
          const transform = $el.css('transform')

          // Extract all matrix values: matrix(a, b, c, d, tx, ty)
          const match = transform.match(/matrix\(([^)]+)\)/)

          if (match) {
            const values = match[1].split(',').map((v) => parseFloat(v.trim()))
            const [scaleX, skewY, skewX, scaleY, translateX, translateY] = values

            expect(scaleX).to.equal(1)
            expect(skewY).to.equal(0)
            expect(skewX).to.equal(0)
            expect(scaleY).to.equal(1)
            expect(translateX).to.equal(0)
            expect(translateY).to.be.closeTo(141, 1) // translateY (allow ±1 pixel)
          } else {
            throw new Error(`Could not parse transform value: ${transform}`)
          }
        })

        // Show submenu
        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-type-text:first').realHover()

        cy.get('.__cypress-studio-assertions-menu').shadow()
        .find('.assertion-option')
        .contains('Increment')
        .should('be.visible')
      })
    })
  })
})
