describe('NewSpec', () => {
  beforeEach(() => {
    cy.setupE2E('spec-generation')

    // Fails locally (cypress:open) unless I refresh browsers
    cy.withCtx(async (ctx) => {
      await ctx.actions.app.refreshBrowsers()
    })

    cy.initializeApp()

    cy.withCtx((ctx) => {
      const { fs, path, activeProject } = ctx
      const projectRoot = activeProject?.projectRoot as string
      const generatedFile = 'src/Button.cy.jsx'
      const generatedFileCopy = 'src/Button-copy-1.cy.jsx'

      fs.removeSync(path.join(projectRoot, generatedFile))
      fs.removeSync(path.join(projectRoot, generatedFileCopy))
    })
  })

  const getCodeGenCandidates = () => cy.get('li')

  it('should detect components from glob', () => {
    cy.visitApp('#/newspec')
    cy.wait(1000)

    cy.findByText('Generate From Component').click()

    getCodeGenCandidates().first().contains('Button.jsx')
  })

  it('detects Storybook and generates a spec from story', () => {
    cy.visitApp('#/newspec')
    cy.wait(1000)
    cy.intercept('mutation-NewSpec_GenerateSpecFromStory').as('generateSpecFromStory')

    cy.findByText('Generate From Story').should('not.be.disabled').click()
    getCodeGenCandidates().first().contains('Button.stories.jsx').click()
    cy.wait('@generateSpecFromStory')

    cy.withCtx((ctx) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.baseName).eq('Button.cy.jsx')
    })

    // Test creating a copy
    getCodeGenCandidates().first().contains('Button.stories.jsx').click()
    cy.wait('@generateSpecFromStory')

    cy.withCtx((ctx) => {
      const generatedSpec = ctx.activeProject?.generatedSpec

      expect(generatedSpec?.spec.baseName).eq('Button-copy-1.cy.jsx')
      ctx.fs.accessSync(generatedSpec?.spec.absolute as string, ctx.fs.constants.F_OK)
    })
  })
})
