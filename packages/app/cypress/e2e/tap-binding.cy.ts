describe('tap binding', () => {
  it('mounts window.__CYPRESS_TAP_BINDING__ on the runner top window', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    cy.window().then(async (win) => {
      const binding = win.__CYPRESS_TAP_BINDING__

      if (!binding) {
        throw new Error('"window.__CYPRESS_TAP_BINDING__" is expected to be available')
      }

      expect(await binding.exec('health')).to.deep.eq({ ok: true, result: 'ok' })

      const schema = await binding.getSchema()

      expect(schema.protocolVersion).to.eq(1)
      expect(schema.commands.map((command) => command.name)).to.include('health')

      const unknown = await binding.exec('not-a-command')

      expect(unknown).to.deep.include({ ok: false, code: 'UNKNOWN_COMMAND' })
    })
  })
})
