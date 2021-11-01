import TerminalPrompt from './TerminalPrompt.vue'

describe('<TerminalPrompt />', () => {
  it('playground', { viewportWidth: 80, viewportHeight: 60 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <TerminalPrompt projectName="design-system" command="git add cypress.config.js"/>
      </div>
    ))
  })
})
