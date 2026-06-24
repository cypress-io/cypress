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

      const schema = await binding.getSchema()

      expect(schema.schemaVersion).to.eq(1)
      expect(schema.commands.map((command) => command.name)).to.include.members(['specs'])

      const unknown = await binding.exec('not-a-command')

      expect((unknown as { error: { code: string } }).error.code).to.eq('UNKNOWN_COMMAND')

      const outcome = await binding.exec('specs')

      expect('result' in outcome).to.eq(true)

      const specs = (outcome as { result: Array<{ relative: string, specType: string }> }).result

      expect(specs).to.deep.include({ relative: 'cypress/e2e/dom-content.spec.js', specType: 'integration' })

      for (const spec of specs) {
        expect(Object.keys(spec), `entry ${spec.relative}`).to.deep.eq(['relative', 'specType'])
      }
    })
  })
})
