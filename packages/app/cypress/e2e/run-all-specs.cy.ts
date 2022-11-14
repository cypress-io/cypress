describe('run-all-specs', () => {
  const ALL_SPECS = {
    spec1: { relative: 'cypress/e2e/folder-1/spec-1.cy.js', name: 'runs folder-1/spec-1' },
    spec2: { relative: 'cypress/e2e/folder-1/spec-2.cy.js', name: 'runs folder-1/spec-2' },
    spec3: { relative: 'cypress/e2e/folder-2/spec-3.cy.js', name: 'runs folder-2/spec-3' },
    spec4: { relative: 'cypress/e2e/folder-2/spec-4.cy.js', name: 'runs folder-2/spec-4' },
  }

  it('can run all specs with filter and live-reloading', () => {
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs')
    cy.startAppServer()
    cy.visitApp()

    // Spawns new browser so we need to stub this
    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.project, 'launchProject').resolves()
    })

    // Verify "Run All Specs"
    cy.contains('button', 'Run All Specs').click()

    cy.withCtx((ctx, { allSpecs }) => {
      expect(ctx.actions.project.launchProject).to.have.been.calledWith('e2e', undefined, '__all')
      expect(ctx.project.runAllSpecs).to.include.members(Object.values(allSpecs).map((spec) => spec.relative))
    }, { allSpecs: ALL_SPECS })

    cy.waitForSpecToFinish({ passCount: 4 })

    for (const spec of Object.values(ALL_SPECS)) {
      cy.get('.runnable-title').contains(spec.name)
    }

    // Verify "Run All Specs" with filter
    cy.get('[data-cy=sidebar-link-specs-page]').click()

    cy.findByLabelText('Search specs').type('folder-1')
    cy.get('[data-cy=spec-list-file]').contains('spec-3').should('not.exist')

    cy.contains('button', 'Run All Specs').click()

    cy.waitForSpecToFinish({ passCount: 2 })

    cy.withCtx((ctx, { allSpecs: { spec1, spec2 } }) => {
      expect(ctx.project.runAllSpecs).to.include.members([spec1.relative, spec2.relative])
    }, { allSpecs: ALL_SPECS })

    for (const spec of [ALL_SPECS.spec1, ALL_SPECS.spec2]) {
      cy.get('.runnable-title').contains(spec.name)
    }

    // Verify live-reloading
    cy.withCtx(async (ctx, { allSpecs: { spec1 } }) => {
      const originalContent = await ctx.actions.file.readFileInProject(spec1.relative)
      const newContent = originalContent.replace('expect(true)', 'expect(false)')

      expect(newContent).not.eq(originalContent)

      await ctx.actions.file.writeFileInProject(spec1.relative, newContent)
    }, { allSpecs: ALL_SPECS })

    cy.waitForSpecToFinish({ passCount: 1, failCount: 1 })
  })
})
