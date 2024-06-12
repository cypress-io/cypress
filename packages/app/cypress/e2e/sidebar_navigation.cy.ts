import type { SinonStub } from 'sinon'

describe('Sidebar Navigation', { viewportWidth: 1280 }, () => {
  context('accessibility', () => {
    beforeEach(() => {
      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.startAppServer()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('todos')
    })

    it('can tab through navigation', () => {
      cy.get('body').focus()
      .tab().should('have.attr', 'data-cy', 'toggle-sidebar').should('have.prop', 'tagName', 'BUTTON')
      .tab().should('have.attr', 'data-cy', 'sidebar-header').should('have.attr', 'role', 'button')
      .tab().should('have.attr', 'href', '#/specs').should('have.prop', 'tagName', 'A')
      .tab().should('have.attr', 'href', '#/runs').should('have.prop', 'tagName', 'A')
      .tab().should('have.attr', 'href', '#/debug').should('have.prop', 'tagName', 'A')
      .tab().should('have.attr', 'href', '#/settings').should('have.prop', 'tagName', 'A')
      .tab().should('have.attr', 'data-cy', 'keyboard-modal-trigger').should('have.prop', 'tagName', 'BUTTON')
    })

    it('has appropriate aria attributes', () => {
      cy.findByTestId('toggle-sidebar')
      .should('have.attr', 'aria-controls', 'sidebar')
      .should('have.attr', 'aria-expanded', 'true')
      .should('have.attr', 'aria-label', 'Collapse sidebar')
      .click()
      .should('have.attr', 'aria-expanded', 'false')
      .should('have.attr', 'aria-label', 'Expand sidebar')

      cy.findByTestId('keyboard-modal-trigger')
      .should('have.attr', 'aria-label', 'Keyboard shortcuts')

      cy.get('nav')
      .should('have.attr', 'aria-label', 'Pages')

      cy.findByTestId('sidebar-header')
      .should('have.attr', 'aria-label', 'todos - Choose a testing type')
    })
  })

  context('as e2e testing type with localSettings', () => {
    it('use saved state for nav size', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.localSettings.setPreferences(JSON.stringify({ reporterWidth: 100 }), 'global')
      })

      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.startAppServer()
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.contains('fixture.js').click()

      cy.get('.toggle-specs-text').click()

      cy.findByTestId('reporter-panel').invoke('outerWidth').then(($initialWidth) => {
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
      cy.specsPageIsVisible()
      cy.contains('todos')
    })

    it('expands the left nav bar by default', () => {
      cy.findByTestId('sidebar').should('have.css', 'width', '248px') // assert width to ensure transition has finished
      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    })

    it('highlights indicator on hover showing you can click to expand', () => {
      const navIndicatorSelector = '[data-cy=sidebar-nav-indicator]'

      cy.get(navIndicatorSelector).should('not.be.visible')
      cy.findByTestId('toggle-sidebar').realHover()
      cy.get(navIndicatorSelector).should('be.visible')

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    })

    it('closes the left nav bar when clicking the expand button (if expanded)', () => {
      cy.findByTestId('sidebar').contains('todos').should('be.visible')
      cy.findByTestId('toggle-sidebar').click()
      cy.findByTestId('sidebar').contains('todos').should('not.be.visible')

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    })

    it('closes the left nav bar when clicking the expand button and persist the state if browser is refreshed', () => {
      cy.findByTestId('sidebar').contains('todos').should('be.visible')
      cy.findByTestId('toggle-sidebar').click()

      cy.findByTestId('sidebar').contains('todos').should('not.be.visible')

      cy.reload()

      cy.findByTestId('sidebar').contains('todos').should('not.be.visible')

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    })

    it('has menu item that shows the keyboard shortcuts modal (unexpanded state)', () => {
      cy.findByTestId('toggle-sidebar').click()
      cy.findByTestId('sidebar').should('have.css', 'width', '64px') // assert width to ensure transition has finished

      cy.findByTestId('keyboard-modal-trigger').should('be.visible').click()
      cy.contains('h2', 'Keyboard shortcuts').should('be.visible')
      cy.get('li p').contains('Re-run tests').should('be.visible')
      cy.get('li p').contains('Stop tests').should('be.visible')
      cy.get('li p').contains('Toggle specs list').should('be.visible')
      cy.get('li span').contains('r')
      cy.get('li span').contains('s')
      cy.get('li span').contains('f')

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
      cy.get('[aria-label="Close"]').click()
      cy.findAllByTestId('keyboard-modal').should('not.exist')
    })

    it('shows a tooltip when hovering over menu item', () => {
      cy.findByTestId('toggle-sidebar').click()
      cy.findByTestId('sidebar').should('have.css', 'width', '64px') // assert width to ensure transition has finished

      cy.findByTestId('sidebar-header').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'todos')
      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
      cy.findByTestId('sidebar-header').trigger('mouseout')

      cy.findByTestId('sidebar-link-runs-page').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Runs')
      cy.findByTestId('sidebar-link-runs-page').trigger('mouseout')

      cy.findByTestId('sidebar-link-specs-page').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Specs')
      cy.findByTestId('sidebar-link-specs-page').trigger('mouseout')

      cy.findByTestId('sidebar-link-debug-page').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Debug')
      cy.findByTestId('sidebar-link-debug-page').trigger('mouseout')

      cy.findByTestId('sidebar-link-settings-page').trigger('mouseenter')
      cy.contains('.v-popper--some-open--tooltip', 'Settings')
      cy.findByTestId('sidebar-link-settings-page').trigger('mouseout')
    })

    it('opens the left nav bar when clicking the expand button (if unexpanded)', () => {
      cy.findByTestId('toggle-sidebar').click()
      cy.findByTestId('sidebar').contains('todos').should('not.be.visible')
      cy.findByTestId('toggle-sidebar').click()
      cy.findByTestId('sidebar').contains('todos').should('be.visible')
    })

    it('displays the project name and opens a modal to switch testing type', () => {
      cy.findByTestId('sidebar-header').within(() => {
        cy.findByTestId('testing-type-e2e').should('be.visible')
        cy.contains('todos').should('be.visible')
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
      cy.findByTestId('toggle-sidebar').click()
      cy.findByTestId('sidebar-header').click()
      cy.findByText('Choose a testing type').should('be.visible')
    })

    it('has menu item that shows the keyboard shortcuts modal (expanded state)', () => {
      cy.findByTestId('keyboard-modal-trigger').should('be.visible').click()
      cy.contains('h2', 'Keyboard shortcuts').should('be.visible')
      cy.get('li p').contains('Re-run tests').should('be.visible')
      cy.get('li p').contains('Stop tests').should('be.visible')
      cy.get('li p').contains('Toggle specs list').should('be.visible')
      cy.get('li span').contains('r')
      cy.get('li span').contains('s')
      cy.get('li span').contains('f')
      cy.get('[aria-label="Close"]').click()
      cy.findByText('Keyboard shortcuts').should('not.exist')
    })

    it('has a menu item labeled "Runs" which takes you to the Runs page', () => {
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('not.exist')

      cy.findByTestId('sidebar-link-runs-page').should('have.text', 'Runs').should('be.visible').click()
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('be.visible')
      cy.get('.router-link-active').findByText('Runs').should('be.visible')
    })

    it('has a menu item labeled "Specs" which takes you to the Spec List page', () => {
      cy.findByTestId('sidebar').within(() => {
        cy.findByText('Specs').should('be.visible').click()
      })

      cy.get('[data-cy="app-header-bar"]').findByText('Specs').should('be.visible')
      cy.get('.router-link-active').findByText('Specs').should('be.visible')
    })

    it('has a menu item labeled "Debug" which takes you to the Debug page', () => {
      cy.get('[data-cy="app-header-bar"]').findByText('Debug').should('not.exist')

      cy.findByTestId('sidebar-link-debug-page').should('contain', 'Debug').should('be.visible').click()
      cy.get('[data-cy="app-header-bar"]').findByText('Debug').should('be.visible')
      cy.get('.router-link-active').findByText('Debug').should('be.visible')
    })

    it('Specs sidebar nav link is not active when a test is running', () => {
      cy.location('hash').should('equal', '#/specs')
      cy.contains('.router-link-exact-active', 'Specs')

      cy.findAllByTestId('spec-item').first().click()
      cy.location('hash').should('contain', '#/specs/runner')
      cy.contains('.router-link-exact-active', 'Specs').should('not.exist')
      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

      cy.findByTestId('sidebar-link-specs-page').click()
      cy.location('hash').should('equal', '#/specs')
      cy.contains('.router-link-exact-active', 'Specs')
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
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.localSettings, 'setPreferences').resolves()
      })

      cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').should('eq', 450)

      cy.get('[data-cy="panel2ResizeHandle"]').trigger('mousedown', { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', { clientX: 400 })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

      cy.withRetryableCtx((ctx, o) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.args[0]).to.eq('{"reporterWidth":336}')
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
      cy.openProject('pristine-with-ct-testing', ['--component'])
      cy.startAppServer('component')
      cy.visitApp()
      cy.specsPageIsVisible('new-project')

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
        o.sinon.stub(ctx.actions.wizard, 'scaffoldTestingType').resolves()
      })

      cy.get('[data-cy-testingtype="e2e"]').within(() => {
        cy.contains('Not Configured')
      }).click()

      cy.withRetryableCtx((ctx) => {
        expect(ctx.coreData.app.relaunchBrowser).eq(false)
        expect(ctx.actions.project.setAndLoadCurrentTestingType).to.have.been.calledWith('e2e')
        expect(ctx.actions.project.reconfigureProject).to.have.been.called
        expect(ctx.actions.wizard.scaffoldTestingType).to.have.been.called
      })
    })
  })
})
