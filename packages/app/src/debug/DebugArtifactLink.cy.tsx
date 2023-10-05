import DebugArtifactLink from './DebugArtifactLink.vue'
import type { ArtifactType } from './utils/debugArtifacts'

describe('<DebugArtifacts />', () => {
  const artifactMapping: {icon: ArtifactType, text: string, url: string}[] = [
    { icon: 'TERMINAL_LOG', text: 'View Log', url: 'www.cypress.io' },
    { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: 'cloud.cypress.io' },
    { icon: 'PLAY', text: 'View Video', url: 'www.cypress.io' },
    { icon: 'REPLAY', text: 'View Replay', url: 'www.cypress.io' },
  ]

  it('mounts correctly, provides expected tooltip content, and emits correct event', () => {
    artifactMapping.forEach((artifact) => {
      cy.mount(() => (
        <DebugArtifactLink class="m-[24px] inline-flex" icon={artifact.icon} popperText={artifact.text} url={artifact.url}/>
      ))

      cy.findByTestId(`artifact-for-${artifact.icon}`).should('have.length', 1)
      cy.findByTestId(`${artifact.icon}-button`).should('be.visible')
      cy.findByTestId(`artifact-for-${artifact.icon}`).realHover().then(() => {
        cy.findByTestId('tooltip-content').should('be.visible').contains(artifact.text)
      })

      cy.percySnapshot()
    })
  })

  it('mounts correctly for all icons together and has correct URLs', () => {
    cy.mount(() => (
      <div class="flex grow space-x-4.5 pt-[24px] justify-center" data-cy='debug-artifacts-all'>
        <DebugArtifactLink icon={'TERMINAL_LOG'} popperText={'View Log'} url={'www.cypress.io'}/>
        <DebugArtifactLink icon={'IMAGE_SCREENSHOT'} popperText={'View Screenshot'} url={'cloud.cypress.io'}/>
        <DebugArtifactLink icon={'PLAY'} popperText={'View Video'} url={'www.cypress.io'}/>
        <DebugArtifactLink icon={'REPLAY'} popperText={'View Test Replay'} url={'www.cypress.io'}/>
      </div>
    ))

    cy.findByTestId('debug-artifacts-all').children().should('have.length', 4)
    cy.findByTestId(`TERMINAL_LOG-button`).should('have.attr', 'href', 'www.cypress.io')
    cy.findByTestId(`IMAGE_SCREENSHOT-button`).should('have.attr', 'href', 'cloud.cypress.io')
    cy.findByTestId(`PLAY-button`).should('have.attr', 'href', 'www.cypress.io')
    cy.findByTestId(`REPLAY-button`).should('have.attr', 'href', 'www.cypress.io')
  })
})
