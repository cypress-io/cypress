import TerminalPrompt from './TerminalPrompt.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<TerminalPrompt />', () => {
  it('renders without overflow', { viewportWidth: 800, viewportHeight: 120 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt command="git add cypress.config.js"/>
      </div>
    ))

    cy.contains('button', defaultMessages.clipboard.copy)
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
    cy.contains('button', defaultMessages.clipboard.copy)
    .should('be.visible')
    .percySnapshot()
  })
})
