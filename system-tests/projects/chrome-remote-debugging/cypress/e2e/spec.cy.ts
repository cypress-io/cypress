type LaunchArgsState = {
  port: number
  portWasAlreadySet: boolean
  portFromEnv: string | undefined
}

const getBrowserVersion = () => {
  return Cypress.automation('remote:debugger:protocol', { command: 'Browser.getVersion' })
}

describe('chrome remote debugging', () => {
  beforeEach(() => {
    cy.task('disconnectCdp').visit('index.html')
  })

  it('hands before:browser:launch the port it launched Chrome on', () => {
    cy.task<LaunchArgsState>('launchArgsState').then((state) => {
      expect(state.portWasAlreadySet, '--remote-debugging-port is already in the launch args').to.be.true
      expect(`${state.port}`, 'Chrome was launched on the port CYPRESS_REMOTE_DEBUGGING_PORT asked for').to.eq(state.portFromEnv)
    })

    cy.task<string>('cdpBrowserProduct').then((product) => {
      return getBrowserVersion().then((version) => {
        expect(product, 'that port belongs to the browser Cypress automates').to.eq(version.product)
      })
    })
  })

  it('lets a second CDP client drive the page while Cypress is attached', () => {
    cy.get('#printable').should('not.be.visible')

    cy.task('activatePrintMediaQuery')

    cy.get('#printable').should('be.visible')
  })

  it('keeps Cypress automation working after a second CDP client disconnects', () => {
    cy.task<string>('cdpBrowserProduct').then((product) => {
      cy.task('disconnectCdp')

      cy.then(getBrowserVersion).its('product').should('eq', product)
    })
  })
})
