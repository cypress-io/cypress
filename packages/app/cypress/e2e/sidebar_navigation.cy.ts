describe('Sidebar Navigation', () => {
  context('as e2e testing type', () => {
    beforeEach(() => {
      cy.scaffoldProject('todos')
      cy.scaffoldProject('pristine-with-e2e-testing')
      cy.openProject('todos')
      cy.startAppServer()
      cy.visitApp()
    })

    it('expands the left nav bar by default', () => {
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
      cy.percySnapshot()
    })

    it('highlights indicator on hover showing you can click to expand', () => {
      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).should('not.have.css', 'outline', 'rgba(0, 0, 0, 0) solid 2px')

      cy.findByLabelText('toggle navigation', {
        selector: 'button',
      }).realHover().should('have.css', 'outline', 'rgba(0, 0, 0, 0) solid 2px')

      cy.percySnapshot()
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

      cy.get('[data-cy="sidebar-header"').realHover()
      cy.contains('#tooltip-target > div', 'todos')
      cy.percySnapshot()
      cy.get('[data-cy="sidebar-header"]').trigger('mouseout')

      cy.get('[data-e2e-href="/runs"]').realHover()
      cy.contains('#tooltip-target > div', 'Runs')
      cy.get('[data-e2e-href="/runs"]').trigger('mouseout')

      cy.get('[data-e2e-href="/specs"]').realHover()
      cy.contains('#tooltip-target > div', 'Specs')
      cy.get('[data-e2e-href="/specs"]').trigger('mouseout')

      cy.get('[data-e2e-href="/settings"]').realHover()
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
      cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

      cy.get('[data-cy="sidebar-header"]').within(() => {
        cy.get('[data-cy="testing-type-e2e"]').should('be.visible')
        cy.findByText('todos').should('be.visible')
      }).click()

      cy.findByText('Choose a testing type').should('be.visible')

      cy.get('[data-cy-testingtype=e2e]').within(() => {
        cy.contains('Configured')
      })

      cy.intercept('mutation-SwitchTestingType_ReconfigureProject').as('SwitchTestingType')
      cy.withCtx((ctx) => {
        ctx.actions.project.reconfigureProject = sinon.stub()
      })

      cy.get('[data-cy-testingtype="component"]').within(() => {
        cy.contains('Not Configured')
      }).click()

      cy.wait('@SwitchTestingType').then((interception) => {
        expect(interception.request.body.variables.testingType).eq('component')
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
  })

  context('as component testing type', () => {
    it('shows if testing type is configured when clicking switch testing type', () => {
      cy.scaffoldProject('pristine-with-ct-testing')
      cy.openProject('pristine-with-ct-testing')
      cy.startAppServer('component')
      cy.visitApp()

      cy.get('[data-cy="sidebar-header"]').within(() => cy.get('[data-cy="testing-type-component"]')).click()
      cy.get('[data-cy-testingtype=component]').within(() => {
        cy.contains('Configured')
      })

      cy.intercept('mutation-SwitchTestingType_ReconfigureProject').as('SwitchTestingType')
      cy.withCtx((ctx) => {
        ctx.actions.project.reconfigureProject = sinon.stub()
      })

      cy.get('[data-cy-testingtype="e2e"]').within(() => {
        cy.contains('Not Configured')
      }).click()

      cy.wait('@SwitchTestingType').then((interception) => {
        expect(interception.request.body.variables.testingType).eq('e2e')
      })
    })
  })
})
