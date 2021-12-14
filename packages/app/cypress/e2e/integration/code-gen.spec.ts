import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

const extensionInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byExtensionInput}"]`

describe('Code Generation', () => {
  beforeEach(() => {
    cy.scaffoldProject('react-code-gen')
    cy.openProject('react-code-gen')
    cy.startAppServer('component')
    cy.visitApp()
  })

  const checkCodeGenCandidates = (specs: string[]) => {
    cy.findByTestId('file-match-indicator').contains(`${specs.length} Match${specs.length > 1 ? 'es' : ''}`)
    cy.findAllByTestId('file-list-row').should('have.length', specs.length)
    .each((row, i) => cy.wrap(row).contains(specs[i]))
  }

  it('should generate spec from component', () => {
    cy.findByTestId('new-spec-button').click()
    cy.findByTestId('create-spec-modal').should('be.visible').within(() => {
      cy.contains('Create a new spec').should('be.visible')
      cy.get('[data-cy="external"]').should('have.attr', 'href', 'https://on.cypress.io')
    })

    cy.contains('Create from component').click()
    const componentGlob = '**/*.{jsx,tsx}'

    cy.findByTestId('file-match-button').contains(componentGlob)
    checkCodeGenCandidates(['App.cy.jsx', 'App.jsx', 'index.jsx', 'Button.jsx', 'Button.stories.jsx'])

    cy.intercept('query-ComponentGeneratorStepOne').as('code-gen-candidates')
    cy.findByTestId('file-match-button').click()
    cy.get(extensionInputSelector).clear().type('**/App.*')
    cy.wait('@code-gen-candidates')

    checkCodeGenCandidates(['App.css', 'App.cy.jsx', 'App.jsx'])

    cy.get(extensionInputSelector).clear().type(componentGlob, { parseSpecialCharSequences: false })
    cy.contains('Button.jsx').click()
    cy.findByTestId('file-row').contains('src/stories/Button.cy.js').click()

    cy.withCtx(async (ctx) => {
      const spec = await (await ctx.project.findSpecs(ctx.currentProject?.projectRoot ?? '', 'component'))
      .find((spec) => spec.relative === 'src/stories/Button.cy.jsx')

      expect(spec).to.exist
    })
  })

  it('should generate spec from story', () => {
    cy.findByTestId('new-spec-button').click()

    cy.contains('Create from story').click()
    const storyGlob = '**/*.stories.*'

    cy.findByTestId('file-match-button').contains(storyGlob)
    checkCodeGenCandidates(['Button.stories.jsx'])

    cy.contains('Button.stories.jsx').click()
    cy.findByTestId('file-row').contains('src/stories/Button.stories.cy.js').click()
    cy.contains('composeStories')

    cy.withCtx(async (ctx) => {
      const spec = await (await ctx.project.findSpecs(ctx.currentProject?.projectRoot ?? '', 'component'))
      .find((spec) => spec.relative === 'src/stories/Button.stories.cy.jsx')

      expect(spec).to.exist
    })
  })
})
