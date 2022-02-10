import { loadSpec } from './support/spec-loader'

describe('sessions ui', {
  viewportWidth: 1000,
  viewportHeight: 660,
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  it('empty session with no data', () => {
    loadSpec({
      fileName: 'blank_session.cy.js',
      passCount: 1,
    })

    cy.get('.sessions-container').click()
    .should('contain', 'blank_session')

    cy.percySnapshot()
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

    cy.percySnapshot()
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

    cy.percySnapshot()
  })
})
