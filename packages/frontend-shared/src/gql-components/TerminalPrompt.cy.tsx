import TerminalPrompt from './TerminalPrompt.vue'
import { defaultMessages } from '@cy/i18n'

describe('<TerminalPrompt />', () => {
  it('renders without overflow', { viewportWidth: 800, viewportHeight: 120 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt projectFolderName="design-system" command="git add cypress.config.js"/>
      </div>
    ))

    cy.contains('button', defaultMessages.clipboard.copy)
    .should('be.visible')
    .percySnapshot()
  })

  it('overflows nicely', { viewportWidth: 800, viewportHeight: 120 }, () => {
    const command = 'yarn workspace @packages/frontend-shared cypress:run --record --key 123as4d56asda987das'
    const projectFolderName = 'design-system'

    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt projectFolderName={projectFolderName} command={command}/>
      </div>
    ))

    cy.contains(command)
    cy.contains(projectFolderName)
    cy.contains('button', defaultMessages.clipboard.copy)
    .should('be.visible')
    .percySnapshot()
  })
})
