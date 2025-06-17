import { snapshotReporter } from './support/snapshot-reporter'
import { loadSpec } from './support/spec-loader'

describe('src/cypress/runner ui states', { retries: 0, defaultCommandTimeout: 600000 }, () => {
  beforeEach(() => {
    cy.viewport(1000, 1500)
  })

  it('hooks', () => {
    loadSpec({
      filePath: 'runner/ui-states/hooks.cy.js',
      passCount: 1,
    })

    cy.contains('test hooks').should('be.visible')
    snapshotReporter()
  })

  it('nested tests', () => {
    loadSpec({
      filePath: 'runner/ui-states/nested-tests.cy.js',
      passCount: 1,
    })

    cy.contains('Nested Tests').should('be.visible')
    snapshotReporter()
  })

  describe('commands', () => {
    it('part 1 - basic commands', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 1,
      })

      cy.contains('part 1 - basic commands').should('be.visible').click()
      snapshotReporter()
    })

    it('part 2 - traversal and navigation', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 2,
      })

      cy.contains('part 2 - traversal and navigation').should('be.visible')
      .click()

      snapshotReporter()
    })

    it('part 3 - element manipulation', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 3,
      })

      cy.contains('part 3 - element manipulation').should('be.visible')
      .click()

      snapshotReporter()
    })

    it('part 4 - advanced interactions', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 4,
      })

      cy.contains('part 4 - advanced interactions').should('be.visible')
      .click()

      snapshotReporter()
    })

    it('commands that do not appear in command log', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 1,
      })

      cy.contains('commands that do not appear in command log').should('be.visible').click()
      snapshotReporter()
    })

    it('form interaction command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 2,
      })

      cy.contains('form interaction command options').should('be.visible').click()
      snapshotReporter()
    })

    it('DOM traversal command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 3,
      })

      cy.contains('DOM traversal command options').should('be.visible').click()
      snapshotReporter()
    })

    it('element state and navigation command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 4,
      })

      cy.contains('element state and navigation command options').should('be.visible').click()
      snapshotReporter()
    })

    it('element traversal and file operations command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 5,
      })

      cy.contains('element traversal and file operations command options').should('be.visible').click()
      snapshotReporter()
    })

    it('scrolling and form interaction command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 6,
      })

      cy.contains('scrolling and form interaction command options').should('be.visible').click()
      snapshotReporter()
    })

    it('user interaction and window command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 7,
      })

      cy.contains('user interaction and window command options').should('be.visible').click()
      snapshotReporter()
    })

    it('verify element visibility state', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 8,
      })

      cy.contains('verify element visibility state').should('be.visible').click()
      snapshotReporter()
    })
  })

  it('status codes', () => {
    loadSpec({
      filePath: 'runner/ui-states/status-codes.cy.js',
      failCount: 1,
    })

    cy.contains('Request Statuses').should('be.visible')
    snapshotReporter()
  })

  it('page events', () => {
    loadSpec({
      filePath: 'runner/ui-states/page-events.cy.js',
      failCount: 1,
    })

    cy.contains('events - page events').should('be.visible')
    snapshotReporter()
  })

  describe('errors', () => {
    it('simple error with docs link', () => {
      loadSpec({
        filePath: 'runner/ui-states/errors.cy.js',
        failCount: 1,
      })

      cy.contains('simple error with docs link').should('be.visible')
      snapshotReporter()
    })

    it('long error', () => {
      loadSpec({
        filePath: 'runner/ui-states/errors.cy.js',
        failCount: 2,
      })

      cy.contains('simple error with docs link').click()
      cy.contains('long error').should('be.visible')
      snapshotReporter()
    })
  })
})
