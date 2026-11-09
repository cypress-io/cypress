import TerminalPrompt from './TerminalPrompt.vue'

describe('<TerminalPrompt />', () => {
  it('renders without overflow', { viewportWidth: 800, viewportHeight: 120 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt command="git add cypress.config.js"/>
      </div>
    ))

    cy.contains('button', 'Copy')
    .should('be.visible')
  })

  it('overflows nicely', { viewportWidth: 800, viewportHeight: 120 }, () => {
    const command = 'yarn workspace @packages/frontend-shared cypress:run --record --key 123as4d56asda987das'

    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt command={command}/>
      </div>
    ))

    cy.findByDisplayValue(command).should('be.visible')
    cy.contains('button', 'Copy')
    .should('be.visible')
    .percySnapshot()
  })
})
