import DebugArtifacts from './DebugArtifacts.vue'

describe('<DebugArtifacts />', () => {
  const artifactMapping: {icon: string, text: string, url: string}[] = [
    { icon: 'TERMINAL_LOG', text: 'View Log', url: 'www.cypress.io' },
    { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: 'cloud.cypress.io' },
    { icon: 'PLAY', text: 'View Video', url: 'www.cypress.io' },
  ]

  it('mounts correctly, provides expected tooltip content, and emits correct event', () => {
    artifactMapping.forEach((artifact) => {
      cy.mount(() => (
        <DebugArtifacts icon={artifact.icon} popperText={artifact.text} url={artifact.url}/>
      ))

      cy.findByTestId(`artifact-for-${artifact.icon}`).should('have.length', 1)
      cy.findByTestId(`${artifact.icon}-button`).should('be.visible')
      cy.findByTestId(`artifact-for-${artifact.icon}`).realHover().then(() => {
        cy.findByTestId('tooltip-content').should('contain.text', `${artifact.text}`)
      })
    })
  })

  it('mounts correctly for all icons together and has correct URLs', () => {
    cy.mount(() => (
      <div class="flex flex-grow justify-center space-x-4.5 pt-24px" data-cy='debug-artifacts-all'>
        <DebugArtifacts icon={'TERMINAL_LOG'} popperText={'View Log'} url={'www.cypress.io'}/>
        <DebugArtifacts icon={'IMAGE_SCREENSHOT'} popperText={'View Screenshot'} url={'cloud.cypress.io'}/>
        <DebugArtifacts icon={'PLAY'} popperText={'View Video'} url={'www.cypress.io'}/>
      </div>
    ))

    cy.findByTestId('debug-artifacts-all').children().should('have.length', 3)
    cy.findByTestId(`TERMINAL_LOG-button`).should('have.attr', 'href', 'www.cypress.io')
    cy.findByTestId(`IMAGE_SCREENSHOT-button`).should('have.attr', 'href', 'cloud.cypress.io')
    cy.findByTestId(`PLAY-button`).should('have.attr', 'href', 'www.cypress.io')
  })
})
