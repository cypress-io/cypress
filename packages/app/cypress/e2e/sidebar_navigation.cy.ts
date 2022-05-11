import type { SinonStub } from 'sinon'

describe('Sidebar Navigation', () => {
  context('accessibility', () => {
    beforeEach(() => {
      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.startAppServer()
      cy.visitApp()
      cy.contains('todos')
    })

    it('can tab through navigation', () => {
      cy.get('body').focus()
      .tab().should('have.attr', 'data-cy', 'toggle-navbar').should('have.prop', 'tagName', 'BUTTON')
      .tab().should('have.attr', 'data-cy', 'sidebar-header').should('have.attr', 'role', 'button')
      .tab().should('have.attr', 'data-cy', 'Specs').should('have.prop', 'tagName', 'BUTTON')
      .tab().should('have.attr', 'data-cy', 'Runs').should('have.prop', 'tagName', 'BUTTON')
      .tab().should('have.attr', 'data-cy', 'Settings').should('have.prop', 'tagName', 'BUTTON')
      .tab().should('have.attr', 'aria-label', 'Keyboard Shortcuts').should('have.prop', 'tagName', 'BUTTON')
    })

    it('has no axe violations', () => {
      cy.injectAxe()
      cy.checkA11y('[data-cy="sidebar"]')
    })

    it('renders appropriate aria attributes for toggle button expanded/collapsed states', () => {
      cy.findByTestId('toggle-navbar')
      .should('have.attr', 'aria-expanded', 'true')
      .should('have.attr', 'aria-label', 'Collapse navigation bar')
      .click()
      .should('have.attr', 'aria-expanded', 'false')
      .should('have.attr', 'aria-label', 'Expand navigation bar')
    })
  })

  context('as e2e testing type with localSettings', () => {
    it('use saved state for nav size', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.localSettings.setPreferences(JSON.stringify({ reporterWidth: 100 }))
      })

      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.startAppServer()
      cy.visitApp()

      cy.contains('fixture.js').click()

      cy.get('.toggle-specs-text').click()

      cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').then(($initialWidth) => {
        expect($initialWidth).eq(100)
      })
    })
  })

  context('as e2e testing type', () => {
    beforeEach(() => {
      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.startAppServer()
      cy.visitApp()
      cy.contains('todos')
    })

    it('expands the left nav bar by default', () => {
      cy.findByTestId('toggle-navbar').should('have.attr', 'aria-expanded', 'true')
      cy.percySnapshot()
    })

    it('highlights indicator on hover showing you can click to expand', () => {
      const navIndicatorSelector = '[data-cy=sidebar-nav-indicator]'

      cy.get(navIndicatorSelector)
      .should('not.be.visible')
      .findByTestId('toggle-navbar')
      .realHover()
      .get(navIndicatorSelector)
      .should('be.visible')
      .percySnapshot()
    })

    it('closes the left nav bar when clicking the expand button (if expanded)', () => {
      cy.findAllByText('todos').eq(1).as('title')
      cy.get('@title').should('be.visible')
      cy.findByTestId('toggle-navbar').click()
      cy.get('@title').should('not.be.visible')
      cy.percySnapshot()
    })

    it('closes the left nav bar when clicking the expand button and persist the state if browser is refreshed', () => {
      cy.findAllByText('todos').eq(1).as('title')
      cy.get('@title').should('be.visible')
      cy.findByTestId('toggle-navbar').click()

      cy.get('@title').should('not.be.visible')

      cy.reload()

      cy.findAllByText('todos').should('not.be.visible')

      cy.percySnapshot()
    })

    it('has menu item that shows the keyboard shortcuts modal (unexpanded state)', () => {
      cy.findByTestId('toggle-navbar').click()

      cy.findByTestId('keyboard-modal-trigger').should('be.visible').click()
      cy.contains('h2', 'Keyboard Shortcuts').should('be.visible')
      cy.get('li p').contains('Re-run tests').should('be.visible')
      cy.get('li p').contains('Stop tests').should('be.visible')
      cy.get('li p').contains('Toggle specs list').should('be.visible')
      cy.get('li span').contains('r')
      cy.get('li span').contains('s')
      cy.get('li span').contains('f')

      cy.percySnapshot()
      cy.get('[aria-label="Close"]').click()
      cy.findByText('Keyboard Shortcuts').should('not.exist')
    })

    it('shows a tooltip when hovering over menu item', () => {
      cy.findByTestId('toggle-navbar').click()

      cy.findByTestId('sidebar-header').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'todos')
      cy.percySnapshot()
      cy.findByTestId('sidebar-header').trigger('mouseout')

      cy.findByTestId('Runs').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Runs')
      cy.findByTestId('Runs').trigger('mouseout')

      cy.findByTestId('Specs').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Specs')
      cy.findByTestId('Specs').trigger('mouseout')

      cy.findByTestId('Settings').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Settings')
      cy.findByTestId('Settings').trigger('mouseout')
    })

    it('opens the left nav bar when clicking the expand button (if unexpanded)', () => {
      cy.findByTestId('toggle-navbar').click()
      cy.findAllByText('todos').eq(1).should('not.be.visible')
      cy.findByTestId('toggle-navbar').click()
      cy.findAllByText('todos').eq(1).should('be.visible')
    })

    it('displays the project name and opens a modal to switch testing type', () => {
      cy.get('[data-cy="sidebar-header"]').within(() => {
        cy.get('[data-cy="testing-type-e2e"]').should('be.visible')
        cy.findByText('todos').should('be.visible')
      }).as('switchTestingType').click()

      cy.findByRole('dialog', {
        name: 'Choose a testing type',
      }).should('be.visible')

      cy.get('[data-cy-testingtype=e2e]').within(() => {
        cy.contains('Running')
      }).click()

      cy.findByRole('dialog', {
        name: 'Choose a testing type',
      }).should('not.exist')

      cy.get('@switchTestingType').click()
      cy.findByRole('dialog', {
        name: 'Choose a testing type',
      }).should('be.visible')

      cy.get('[data-cy-testingtype=e2e]').within(() => {
        cy.contains('Running')
      })

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.project, 'setAndLoadCurrentTestingType')
        o.sinon.stub(ctx.actions.project, 'reconfigureProject').resolves()
      })

      cy.get('[data-cy-testingtype="component"]').within(() => {
        cy.contains('Configured')
      }).click()

      cy.withCtx((ctx) => {
        expect(ctx.coreData.app.relaunchBrowser).eq(true)
        expect(ctx.actions.project.setAndLoadCurrentTestingType).to.have.been.calledWith('component')
        expect(ctx.actions.project.reconfigureProject).to.have.been.called
      })

      cy.get('[aria-label="Close"]').click()
      cy.findByText('Choose a testing type').should('not.exist')

      cy.findByLabelText('Collapse navigation bar', {
        selector: 'button',
      }).click()

      cy.findByTestId('sidebar-header').click()
      cy.findByText('Choose a testing type').should('be.visible')
    })

    it('has menu item that shows the keyboard shortcuts modal (expanded state)', () => {
      cy.findByTestId('keyboard-modal-trigger').should('be.visible').click()
      cy.contains('h2', 'Keyboard Shortcuts').should('be.visible')
      cy.get('li p').contains('Re-run tests').should('be.visible')
      cy.get('li p').contains('Stop tests').should('be.visible')
      cy.get('li p').contains('Toggle specs list').should('be.visible')
      cy.get('li span').contains('r')
      cy.get('li span').contains('s')
      cy.get('li span').contains('f')
      cy.get('[aria-label="Close"]').click()
      cy.findByText('Keyboard Shortcuts').should('not.exist')
    })

    it('has a menu item labeled "Runs" which takes you to the Runs page', () => {
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('not.exist')
      cy.findByText('Runs').should('be.visible')
      cy.findByText('Runs').click()
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('be.visible')
      cy.get('.router-link-active').findByText('Runs').should('be.visible')
    })

    it('has a menu item labeled "Specs" which takes you to the Spec List page', () => {
      cy.findByLabelText('Sidebar').within(() => {
        cy.findByText('Specs').should('be.visible')
        cy.findByText('Specs').click()
      })

      cy.get('[data-cy="app-header-bar"]').findByText('Specs').should('be.visible')
      cy.get('.router-link-active').findByText('Specs').should('be.visible')
    })

    it('has a menu item labeled "Settings" which takes you to the Settings page', () => {
      cy.findByTestId('app-header-bar').findByText('Settings').should('not.exist')
      cy.findByText('Settings').should('be.visible')
      cy.findByText('Settings').click()
      cy.findByTestId('app-header-bar').findByText('Settings').should('be.visible')
      cy.get('.router-link-active').findByText('Settings').should('be.visible')
    })

    it('resize nav sends the correct value on the mutation', () => {
      cy.contains('fixture.js').click()

      cy.get('.toggle-specs-text').click()

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.localSettings, 'setPreferences').resolves()
      })

      cy.findByTestId('reporter-panel').invoke('outerWidth').should('eq', 450)

      cy.findByTestId('panel2ResizeHandle').trigger('mousedown', { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', { clientX: 400 })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

      cy.withRetryableCtx((ctx, o) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.lastArg).to.eq('{"reporterWidth":336}')
      })
    })

    // TODO: Remove skip when we fix cy.reload() in Cypress in Cypress - UNIFY-1346
    it.skip('resize nav and persist the state after refresh', () => {
      cy.contains('fixture.js').click()

      cy.get('.toggle-specs-text').click()

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.localSettings, 'setPreferences').resolves()
      })

      cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').then(($initialWidth) => {
        cy.get('[data-cy="panel2ResizeHandle"]').trigger('mousedown', { eventConstructor: 'MouseEvent' })
        .trigger('mousemove', { clientX: 400 })
        .trigger('mouseup', { eventConstructor: 'MouseEvent' })

        cy.withCtx((ctx, o) => {
          expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.lastArg).to.eq('{"reporterWidth":336}')
        })

        cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').then(($updatedWidth) => {
          expect($updatedWidth).not.to.eq($initialWidth)

          cy.reload()
          cy.contains('fixture.js').click()

          cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').should(($refreshedWidth) => {
            expect($refreshedWidth).eq($updatedWidth)
          })
        })
      })
    })
  })

  context('as component testing type', () => {
    it('shows if testing type is configured when clicking switch testing type', () => {
      cy.scaffoldProject('pristine-with-ct-testing')
      cy.openProject('pristine-with-ct-testing')
      cy.startAppServer('component')
      cy.visitApp()

      cy.get('[data-cy="sidebar-header"]').as('switchTestingType').click()
      cy.findByRole('dialog', {
        name: 'Choose a testing type',
      }).should('be.visible')

      cy.get('[data-cy-testingtype=component]').within(() => {
        cy.contains('Running')
      }).click()

      cy.findByRole('dialog', {
        name: 'Choose a testing type',
      }).should('not.exist')

      cy.get('@switchTestingType').click()
      cy.findByRole('dialog', {
        name: 'Choose a testing type',
      }).should('be.visible')

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.project, 'setAndLoadCurrentTestingType')
        o.sinon.stub(ctx.actions.project, 'reconfigureProject').resolves()
      })

      cy.get('[data-cy-testingtype="e2e"]').within(() => {
        cy.contains('Not Configured')
      }).click()

      cy.withCtx((ctx) => {
        expect(ctx.coreData.app.relaunchBrowser).eq(false)
        expect(ctx.actions.project.setAndLoadCurrentTestingType).to.have.been.calledWith('e2e')
        expect(ctx.actions.project.reconfigureProject).to.have.been.called
      })
    })
  })
})
