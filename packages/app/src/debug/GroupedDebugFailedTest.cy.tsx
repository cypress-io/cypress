import GroupedDebugFailedTest from './GroupedDebugFailedTest.vue'

describe('<GroupedDebugFailedTest/>', () => {
  const debugArtifacts: {icon: string, text: string, url: string}[] = [
    { icon: 'TERMINAL_LOG', text: 'View Log', url: 'www.cypress.io' },
    { icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: 'www.cypress.io' },
    { icon: 'PLAY', text: 'View Video', url: 'www.cypress.io' },
  ]

  const groups = [
    {
      os: {
        name: 'Linux',
        nameWithVersion: 'Linux Debian',
      },
      browser: {
        formattedName: 'Chrome',
        formattedNameWithVersion: 'Chrome 106',
      },
    },
    {
      os: {
        name: 'Windows',
        nameWithVersion: 'Windows 11.2',
      },
      browser: {
        formattedName: 'Electron',
        formattedNameWithVersion: 'Electron 106',
      },
    },
  ]

  it('mounts correctly and shows artifacts on hover', () => {
    cy.mount(() => (
      <div class='pt-24px'>
        <GroupedDebugFailedTest debugArtifacts={debugArtifacts} groups={groups} />
      </div>
    ))

    cy.findAllByTestId(`grouped-row`).should('have.length', 2)
    .each((el) => {
      cy.wrap(el).findByTestId('debug-artifacts').should('not.be.visible')
      cy.wrap(el).realHover().then(() => {
        cy.wrap(el).findByTestId('debug-artifacts').should('be.visible').children().should('have.length', 3)
      })

      cy.wrap(el).findByTestId('stats-metadata').children().should('have.length', 3)
    })
  })
})
