import TerminalPrompt from './TerminalPrompt.vue'

describe('<TerminalPrompt />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 120 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt projectFolderName="design-system" command="git add cypress.config.js"/>
      </div>
    ))
  })

  it('overflows nicely', { viewportWidth: 800, viewportHeight: 120 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt projectFolderName="design-system" command="yarn workspace @packages/frontend-shared cypress:run --record --key 123as4d56asda987das"/>
      </div>
    ))
  })
})
