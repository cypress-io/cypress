describe('Sidebar Navigation', () => {
  context('as e2e testing type with localSettings', () => {
    it('use saved state for nav size', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.localSettings.setPreferences(JSON.stringify({ reporterWidth: 100 }))
      })

      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.startAppServer()
      cy.__incorrectlyVisitAppWithIntercept()

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
      cy.scaffoldProject('pristine-with-e2e-testing')
      cy.openProject('todos')
      cy.startAppServer()
      cy.__incorrectlyVisitAppWithIntercept()
    })

    it('expands the left nav bar by default', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
      cy.percySnapshot()
    })

    it('highlights indicator on hover showing you can click to expand', () => {
      const navIndicatorSelector = '[data-testid=sidebar-nav-indicator]'
      const navExpansionToggleSelector = '[aria-label="toggle navigation"]'

      cy.get(navIndicatorSelector)
      .should('not.be.visible')
      .get(navExpansionToggleSelector)
      .realHover()
      .get(navIndicatorSelector)
      .should('be.visible')
      .percySnapshot()
    })

    it('closes the left nav bar when clicking the expand button (if expanded)', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
      cy.findAllByText('todos').eq(1).as('title')
      cy.get('@title').should('be.visible')

      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
      cy.get('@title').should('not.be.visible')
      cy.percySnapshot()
    })

    it('closes the left nav bar when clicking the expand button and persist the state if browser is refreshed', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
      cy.findAllByText('todos').eq(1).as('title')
      cy.get('@title').should('be.visible')

      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
      cy.get('@title').should('not.be.visible')

      cy.reload()

      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
      cy.findAllByText('todos').should('not.be.visible')

      cy.percySnapshot()
    })

    it('has unlabeled menu item that shows the keyboard shortcuts modal (unexpanded state)', () => {
      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')

      cy.get('[data-cy="keyboard-shortcuts"]').should('be.visible')
      cy.get('[data-cy="keyboard-shortcuts"]').click()
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
      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')

      cy.get('[data-cy="sidebar-header"').trigger('mouseenter')
      cy.contains('#tooltip-target > div', 'todos')
      cy.percySnapshot()
      cy.get('[data-cy="sidebar-header"]').trigger('mouseout')

      cy.get('[data-e2e-href="/runs"]').trigger('mouseenter')
      cy.contains('#tooltip-target > div', 'Runs')
      cy.get('[data-e2e-href="/runs"]').trigger('mouseout')

      cy.get('[data-e2e-href="/specs"]').trigger('mouseenter')
      cy.contains('#tooltip-target > div', 'Specs')
      cy.get('[data-e2e-href="/specs"]').trigger('mouseout')

      cy.get('[data-e2e-href="/settings"]').trigger('mouseenter')
      cy.contains('#tooltip-target > div', 'Settings')
      cy.get('[data-e2e-href="/settings"]').trigger('mouseout')
    })

    it('opens the left nav bar when clicking the expand button (if unexpanded)', () => {
      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.findAllByText('todos').eq(1).should('not.be.visible')

      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
      cy.findAllByText('todos').eq(1).should('be.visible')
    })

    it('displays the project name and opens a modal to switch testing type', () => {
      cy.__incorrectlyVisitAppWithIntercept()
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

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

      cy.intercept('mutation-SwitchTestingTypeAndRelaunch').as('SwitchTestingTypeAndRelaunch')
      cy.withCtx((ctx) => {
        ctx.actions.project.reconfigureProject = sinon.stub()
      })

      cy.get('[data-cy-testingtype="component"]').within(() => {
        cy.contains('Not Configured')
      }).click()

      cy.wait('@SwitchTestingTypeAndRelaunch').then((interception) => {
        expect(interception.request.body.variables.testingType).eq('component')
      })

      cy.withCtx((ctx) => {
        expect(ctx.coreData.app.relaunchBrowser).eq(true)
      })

      cy.get('[aria-label="Close"]').click()
      cy.findByText('Choose a testing type').should('not.exist')

      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).click()

      cy.get('[data-cy="sidebar-header"]').click()
      cy.findByText('Choose a testing type').should('be.visible')
    })

    it('has unlabeled menu item that shows the keyboard shortcuts modal (expanded state)', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

      cy.get('[data-cy="keyboard-shortcuts"]').should('be.visible')
      cy.get('[data-cy="keyboard-shortcuts"]').click()
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
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('not.exist')
      cy.findByText('Runs').should('be.visible')
      cy.findByText('Runs').click()
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('be.visible')
      cy.get('.router-link-active').findByText('Runs').should('be.visible')
    })

    it('has a menu item labeled "Specs" which takes you to the Spec List page', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
      cy.findByLabelText('Sidebar').within(() => {
        cy.findByText('Specs').should('be.visible')
        cy.findByText('Specs').click()
      })

      cy.get('[data-cy="app-header-bar"]').findByText('Specs').should('be.visible')
      cy.get('.router-link-active').findByText('Specs').should('be.visible')
    })

    it('has a menu item labeled "Settings" which takes you to the Settings page', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

      cy.get('[data-cy="app-header-bar"]').findByText('Settings').should('not.exist')
      cy.findByText('Settings').should('be.visible')
      cy.findByText('Settings').click()
      cy.get('[data-cy="app-header-bar"]').findByText('Settings').should('be.visible')
      cy.get('.router-link-active').findByText('Settings').should('be.visible')
    })

    it('resize nav sends the correct value on the mutation', () => {
      cy.contains('fixture.js').click()

      cy.get('.toggle-specs-text').click()

      cy.intercept('mutation-Preferences_SetPreferences').as('setPreferences')

      cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').then(($initialWidth) => {
        cy.get('[data-cy="panel2ResizeHandle"]').trigger('mousedown', { eventConstructor: 'MouseEvent' })
        .trigger('mousemove', { clientX: 400 })
        .trigger('mouseup', { eventConstructor: 'MouseEvent' })

        cy.wait('@setPreferences').its('request.body.variables.value').should('include', '{"reporterWidth":')
      })
    })

    // TODO: Remove skip when we fix cy.reload() in Cypress in Cypress - UNIFY-1346
    it.skip('resize nav and persist the state after refresh', () => {
      cy.contains('fixture.js').click()

      cy.get('.toggle-specs-text').click()

      cy.intercept('mutation-Preferences_SetPreferences').as('setPreferences')

      cy.get('[data-cy="reporter-panel"]').invoke('outerWidth').then(($initialWidth) => {
        cy.get('[data-cy="panel2ResizeHandle"]').trigger('mousedown', { eventConstructor: 'MouseEvent' })
        .trigger('mousemove', { clientX: 400 })
        .trigger('mouseup', { eventConstructor: 'MouseEvent' })

        cy.wait('@setPreferences')

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
      cy.__incorrectlyVisitAppWithIntercept()

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

      cy.intercept('mutation-SwitchTestingTypeAndRelaunch').as('SwitchTestingTypeAndRelaunch')
      cy.withCtx((ctx) => {
        ctx.actions.project.reconfigureProject = sinon.stub()
      })

      cy.get('[data-cy-testingtype="e2e"]').within(() => {
        cy.contains('Not Configured')
      }).click()

      cy.wait('@SwitchTestingTypeAndRelaunch').then((interception) => {
        expect(interception.request.body.variables.testingType).eq('e2e')
      })
    })

    it('shows dropdown to reconfigure project when clicking switch testing type', () => {
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

      cy.get('[data-cy-testingtype="e2e"]').within(() => {
        cy.contains('Not Configured')
      })

      cy.get('[data-cy-testingtype="component"]').within(() => {
        cy.get('[data-cy=status-badge-menu]').click()
        cy.get('[data-cy="Choose a Browser"]').should('not.exist')
        cy.get('[data-cy="Reconfigure"]').should('exist')
      })
    })
  })
})
