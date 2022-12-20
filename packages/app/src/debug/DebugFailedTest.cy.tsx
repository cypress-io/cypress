import DebugFailedTest from './DebugFailedTest.vue'

describe('<DebugFailedTest/>', () => {
  it('mounts correctly', () => {
    const testResult = {
      id: '676df87878',
      titleParts: ['Login', 'Should redirect unauthenticated user to signin page'],
    }

    cy.mount(() => (
      <DebugFailedTest failedTestResult={testResult} />
    ))

    cy.findByTestId('test-row').children().should('have.length', 3)
    cy.findByTestId('failed-icon').should('be.visible')
    testResult.titleParts.forEach((title, index) => {
      cy.findByTestId(`titleParts-${index}`).should('have.text', `${title}`)
    })
  })

  it('contains multiple titleParts segments', () => {
    const multipleTitleParts = {
      id: '676df87878',
      titleParts: ['Login', 'Describe', 'it', 'context', 'Should redirect unauthenticated user to signin page'],
    }

    cy.mount(() => (
      <DebugFailedTest failedTestResult={multipleTitleParts} />
    ))

    cy.findByTestId('test-row').children().should('have.length', 6).should('be.visible')
    multipleTitleParts.titleParts.forEach((title, index) => {
      cy.findByTestId(`titleParts-${index}`).should('have.text', `${title}`)
    })

    cy.percySnapshot()
  })
})
