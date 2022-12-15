import DebugArtifacts from './DebugArtifacts.vue'

describe('<DebugArtifacts />', () => {
  const artifactMapping: {icon: string, text: string, url: string}[] = [
    { icon: 'TERMINAL_LOG', text: 'View Log', url: 'www.cypress.io' },
    { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: 'www.cypress.io' },
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
})
