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

    cy.reporter().contains('test hooks').should('be.visible')
    snapshotReporter()
  })

  it('nested tests', () => {
    loadSpec({
      filePath: 'runner/ui-states/nested-tests.cy.js',
      passCount: 1,
    })

    cy.reporter().contains('Nested Tests').should('be.visible')
    snapshotReporter()
  })

  describe('commands', () => {
    it('part 1 - basic commands', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 1,
      })

      cy.reporter().contains('part 1 - basic commands').should('be.visible').click()
      snapshotReporter()
    })

    it('part 2 - traversal and navigation', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 2,
      })

      cy.reporter().contains('part 2 - traversal and navigation').should('be.visible')
      .click()

      snapshotReporter()
    })

    it('part 3 - element manipulation', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 3,
      })

      cy.reporter().contains('part 3 - element manipulation').should('be.visible')
      .click()

      snapshotReporter()
    })

    it('part 4 - advanced interactions', () => {
      loadSpec({
        filePath: 'runner/ui-states/commandsToDisplay.cy.js',
        passCount: 4,
      })

      cy.reporter().contains('part 4 - advanced interactions').should('be.visible')
      .click()

      snapshotReporter()
    })

    it('commands that do not appear in command log', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 1,
      })

      cy.reporter().contains('commands that do not appear in command log').should('be.visible').click()
      snapshotReporter()
    })

    it('form interaction command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 2,
      })

      cy.reporter().contains('form interaction command options').should('be.visible').click()
      snapshotReporter()
    })

    it('DOM traversal command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 3,
      })

      cy.reporter().contains('DOM traversal command options').should('be.visible').click()
      snapshotReporter()
    })

    it('element state and navigation command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 4,
      })

      cy.reporter().contains('element state and navigation command options').should('be.visible').click()
      snapshotReporter()
    })

    it('element traversal and file operations command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 5,
      })

      cy.reporter().contains('element traversal and file operations command options').should('be.visible').click()
      snapshotReporter()
    })

    it('scrolling and form interaction command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 6,
      })

      cy.reporter().contains('scrolling and form interaction command options').should('be.visible').click()
      snapshotReporter()
    })

    it('user interaction and window command options', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 7,
      })

      cy.reporter().contains('user interaction and window command options').should('be.visible').click()
      snapshotReporter()
    })

    it('verify element visibility state', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 8,
      })

      cy.reporter().contains('verify element visibility state').should('be.visible').click()
      snapshotReporter()
    })

    it('grouped commands', () => {
      loadSpec({
        filePath: 'runner/ui-states/commands.cy.js',
        passCount: 9,
      })

      cy.reporter().contains('grouped commands').should('be.visible').click()
      snapshotReporter()
    })
  })

  it('status codes', () => {
    loadSpec({
      filePath: 'runner/ui-states/status-codes.cy.js',
      failCount: 1,
    })

    cy.reporter().contains('Request Statuses').should('be.visible')
    snapshotReporter()
  })

  it('page events', () => {
    loadSpec({
      filePath: 'runner/ui-states/page-events.cy.js',
      failCount: 1,
    })

    cy.reporter().contains('events - page events').should('be.visible')
    snapshotReporter()
  })

  describe('errors', () => {
    it('simple error with docs link', () => {
      loadSpec({
        filePath: 'runner/ui-states/errors.cy.js',
        failCount: 1,
      })

      cy.reporter().contains('simple error with docs link').should('be.visible')
      snapshotReporter()
    })

    it('long error', () => {
      loadSpec({
        filePath: 'runner/ui-states/errors.cy.js',
        failCount: 2,
      })

      cy.reporter().contains('simple error with docs link').click()
      cy.reporter().contains('long error').should('be.visible')
      snapshotReporter()
    })
  })
})
