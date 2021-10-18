describe('App', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.withCtx(async (ctx) => {
      await ctx.actions.app.refreshBrowsers()
    })

    cy.initializeApp()
  })

  const getCodeGenCandidates = () => cy.get('li')

  it('should detect components from glob and allow glob edit', () => {
    cy.visitApp('#/newspec')
    cy.findByText('Generate From Component').click()

    getCodeGenCandidates().first().contains('Foo.vue')

    cy.findByLabelText('Glob Pattern:').clear().type('/**/*')

    getCodeGenCandidates().contains('Foo.vue')
    getCodeGenCandidates().contains('Button.stories.jsx')
  })

  it('detects Storybook and generates a spec from story', () => {
    cy.visitApp('#/newspec')

    cy.findByText('Generate From Story').should('not.be.disabled').click()
    getCodeGenCandidates().first().contains('Button.stories.jsx').click()
    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.baseName).eq('Button.cy.jsx')
      testState.previousSpec = generatedSpec
    })

    // Test creating a copy
    getCodeGenCandidates().first().contains('Button.stories.jsx').click()
    cy.withCtx((ctx, { testState }) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.baseName).eq('Button-copy-1.cy.jsx')
      ctx.fs.accessSync(generatedSpec?.spec.absolute as string, ctx.fs.constants.F_OK)

      // cleanup
      ctx.fs.removeSync(generatedSpec?.spec.absolute as string)
      ctx.fs.removeSync(testState.previousSpec?.spec.absolute as string)
    })
  })
})
