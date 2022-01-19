import type { Interception } from '@packages/net-stubbing/lib/external-types'

describe('Sidebar Navigation', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')
    cy.openProject('todos')
    cy.startAppServer()
    cy.visitApp()
  })

  it('expands the left nav bar by default', () => {
    cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
  })

  it('highlights indicator on hover showing you can click to expand', () => {
    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).should('not.have.css', 'outline', 'rgba(0, 0, 0, 0) solid 2px')

    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).realHover().should('have.css', 'outline', 'rgba(0, 0, 0, 0) solid 2px')
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
    cy.get('[data-cy="sidebar-header"]').trigger('mouseout')

    cy.get('[data-cy="switch-testing-type"]').realHover()
    cy.contains('#tooltip-target > div', 'E2E Testing')
    cy.get('[data-cy="switch-testing-type"]').trigger('mouseout')

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

  it('displays the project name (expanded state)', () => {
    cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.findAllByText('todos').eq(1).should('be.visible')
  })

  it('has menu item labeled by current active testing type that opens a modal to switch testing type (expanded state)', () => {
    cy.findByLabelText('Sidebar').closest('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')

    cy.findByText('E2E Testing').should('be.visible')
    cy.get('[data-cy="switch-testing-type"]').click()
    cy.findByText('Choose a testing type').should('be.visible')
    cy.intercept('mutation-SwitchTestingType_ReconfigureProject').as('SwitchTestingType')
    cy.get('[data-cy-testingtype="component"]').click()
    cy.wait('@SwitchTestingType').then((interception: Interception) => {
      expect(interception.request.url).to.include('graphql/mutation-SwitchTestingType_ReconfigureProject')
    })

    cy.get('[aria-label="Close"]').click()
    cy.findByText('Choose a testing type').should('not.exist')
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
    cy.findByText('Specs').should('be.visible')
    cy.findByText('Specs').click()
    cy.get('[data-cy="app-header-bar"]').findByText('Specs-Index').should('be.visible')
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
