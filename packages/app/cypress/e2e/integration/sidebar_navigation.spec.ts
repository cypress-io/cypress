describe('Sidebar Navigation', () => {
  before(() => {
    cy.scaffoldProject('todos')
    cy.openProject('todos')
    cy.startAppServer()
    cy.visitApp()
  })

  it('highlights indicator on hover showing you can click to expand', () => {
    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).should('not.have.css', 'outline', 'rgba(0, 0, 0, 0) solid 2px')

    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).realHover().should('have.css', 'outline', 'rgba(0, 0, 0, 0) solid 2px')
  })

  it('closes the bar when clicking the expand button (if expanded)', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
    cy.findByText('todos').should('be.visible')
    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).click()

    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
    cy.findByText('todos').should('not.be.visible')
  })

  it('has unlabeled menu item that shows the keyboard shortcuts modal (unexpanded state)', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
    cy.get('[data-cy="keyboard-shortcuts"]').should('be.visible')
    cy.get('[data-cy="keyboard-shortcuts"]').click()
    cy.get('h2').findByText('Keyboard Shortcuts').should('be.visible')
    cy.get('li p').contains('Re-run tests').should('be.visible')
    cy.get('li p').contains('Stop tests').should('be.visible')
    cy.get('li p').contains('Toggle specs list').should('be.visible')
    cy.get('li span').contains('r')
    cy.get('li span').contains('s')
    cy.get('li span').contains('f')
    cy.get('[aria-label="Close"]').click()
    cy.findByText('Keyboard Shortcuts').should('not.exist')
  })

  it('shows a tooltip when hovering over menu item', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')

    cy.get('[data-cy="sidebar-header"').realHover()
    cy.contains('#tooltip-target > div', 'todos').should('be.visible')
    cy.get('[data-cy="sidebar-header"]').trigger('mouseout')

    cy.get('[data-cy="switch-testing-type"]').realHover()
    cy.contains('#tooltip-target > div', 'E2E Testing').should('be.visible')
    cy.get('[data-cy="switch-testing-type"]').trigger('mouseout')

    cy.get('[data-e2e-href="/runs"]').realHover()
    cy.contains('#tooltip-target > div', 'Runs').should('be.visible')
    cy.get('[data-e2e-href="/runs"]').trigger('mouseout')

    cy.get('[data-e2e-href="/specs"]').realHover()
    cy.contains('#tooltip-target > div', 'Specs').should('be.visible')
    cy.get('[data-e2e-href="/specs"]').trigger('mouseout')

    cy.get('[data-e2e-href="/settings"]').realHover()
    cy.contains('#tooltip-target > div', 'Settings').should('be.visible')
    cy.get('[data-e2e-href="/settings"]').trigger('mouseout')
  })

  it('opens the bar when clicking the expand button (if unexpanded)', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
    cy.findByText('todos').should('not.be.visible')

    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).click()

    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
    cy.findByText('todos').should('be.visible')
  })

  // TODO: assert absolute path is showing (doesn't seem to be implemented right now)
  it('displays the project name and absolute path (expanded state)', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.findByText('todos').should('be.visible')
    // cy.findByText('/cypress/integration/spec.js').should('be.visible')
  })

  it('has menu item labeled by current active testing type that opens a modal to switch testing type (expanded state)', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
    cy.findByText('E2E Testing').should('be.visible')
    cy.get('[data-cy="switch-testing-type"]').click()
    cy.findByText('Choose a testing type').should('be.visible')
    cy.get('[aria-label="Close"]').click()
    cy.findByText('Choose a testing type').should('not.exist')
  })

  it('has unlabeled menu item that shows the keyboard shortcuts modal (expanded state)', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
    cy.get('[data-cy="keyboard-shortcuts"]').should('be.visible')
    cy.get('[data-cy="keyboard-shortcuts"]').click()
    cy.findByText('Keyboard Shortcuts').should('be.visible')
    cy.get('li p').contains('Re-run tests').should('be.visible')
    cy.get('li p').contains('Stop tests').should('be.visible')
    cy.get('li p').contains('Toggle specs list').should('be.visible')
    cy.get('li span').contains('r')
    cy.get('li span').contains('s')
    cy.get('li span').contains('f')
    cy.get('[aria-label="Close"]').click()
    cy.findByText('Keyboard Shortcuts').should('not.exist')
  })

  it('highlights the hovered menu item', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.get('[data-e2e-href="/specs"] > svg > path').should('not.have.css', 'fill', 'rgb(58, 70, 204)')
    cy.get('[data-e2e-href="/specs"]').realHover()
    cy.get('[data-e2e-href="/specs"] > svg > path').should('have.css', 'fill', 'rgb(58, 70, 204)')

    cy.get('[data-e2e-href="/runs"] > svg > path').should('not.have.css', 'fill', 'rgb(58, 70, 204)')
    cy.get('[data-e2e-href="/runs"]').realHover()
    cy.get('[data-e2e-href="/runs"] > svg > path').should('have.css', 'fill', 'rgb(58, 70, 204)')

    cy.get('[data-e2e-href="/settings"] > svg > path').should('not.have.css', 'fill', 'rgb(58, 70, 204)')
    cy.get('[data-e2e-href="/settings"]').realHover()
    cy.get('[data-e2e-href="/settings"] > svg > path').should('have.css', 'fill', 'rgb(58, 70, 204)')

    cy.get('[data-cy="sidebar-header"]').realHover()
  })

  it('has a menu item labeled "Runs" which takes you to the Runs page', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.get('[data-testid="header-bar"]').findByText('Runs').should('not.exist')
    cy.findByText('Runs').should('be.visible')
    cy.findByText('Runs').click()
    cy.get('[data-testid="header-bar"]').findByText('Runs').should('be.visible')
    cy.get('.router-link-active').findByText('Runs').should('be.visible')
    cy.get('[data-e2e-href="/runs"] > svg > path').should('have.css', 'fill', 'rgb(0, 50, 32)')
  })

  it('has a menu item labeled "Specs" which takes you to the Spec List page', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.get('[data-testid="header-bar"]').findByText('Specs-Index').should('not.exist')
    cy.findByText('Specs').should('be.visible')
    cy.findByText('Specs').click()
    cy.get('[data-testid="header-bar"]').findByText('Specs-Index').should('be.visible')
    cy.get('.router-link-active').findByText('Specs').should('be.visible')
    cy.get('[data-e2e-href="/specs"] > svg > path').should('have.css', 'fill', 'rgb(0, 50, 32)')
  })

  it('has a menu item labeled "Settings" which takes you to the Settings page', () => {
    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.get('[data-testid="header-bar"]').findByText('Settings').should('not.exist')
    cy.findByText('Settings').should('be.visible')
    cy.findByText('Settings').click()
    cy.get('[data-testid="header-bar"]').findByText('Settings').should('be.visible')
    cy.get('.router-link-active').findByText('Settings').should('be.visible')
    cy.get('[data-e2e-href="/settings"] > svg > path').should('have.css', 'fill', 'rgb(0, 50, 32)')
  })
})
