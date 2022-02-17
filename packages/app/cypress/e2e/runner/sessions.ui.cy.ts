import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

describe('runner/cypress sessions.ui.spec', {
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  afterEach(function () {
    // @ts-ignore
    if (cy.state('test').state === 'passed') {
      snapshotReporter()
    }
  })

  it('empty session with no data', () => {
    loadSpec({
      fileName: 'blank_session.cy.js',
      passCount: 1,
    })

    cy.get('.sessions-container').click()
    .should('contain', 'blank_session')
  })

  it('shows message for new, saved, and recreated session', () => {
    loadSpec({
      fileName: 'recreated_session.cy.js',
      passCount: 3,
    })

    const clickEl = ($el) => cy.wrap($el).click()

    cy.get('.test').eq(0).then(clickEl)
    cy.get('.test').eq(1).then(clickEl)
    cy.get('.test').eq(2).then(clickEl)

    cy.get('.sessions-container .collapsible-header[role=button]').eq(0).click()
    .should('contain', '1')

    cy.get('.sessions-container .collapsible-header[role=button]').eq(1).click()
    .should('contain', '1')

    cy.get('.test').eq(0)
    .should('contain', 'Sessions (1)')
    .should('contain', 'user1')
    .should('contain', '(new)')

    cy.get('.test').eq(1)
    .should('contain', 'Sessions (1)')
    .should('contain', 'user1')
    .should('contain', '(saved)')

    cy.get('.test').eq(2)
    .should('contain', 'Sessions (1)')
    .should('contain', 'user1')
    .should('contain', '(recreated)')
  })

  it('multiple sessions in a test', () => {
    loadSpec({
      fileName: 'multiple_sessions.cy.js',
      passCount: 1,
    })

    cy.get('.sessions-container').first().click()
    .should('contain', 'Sessions (2)')
    .should('contain', 'user1')
    .should('contain', 'user2')
  })
})
