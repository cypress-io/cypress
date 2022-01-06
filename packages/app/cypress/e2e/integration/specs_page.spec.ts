import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

const extensionInputSelector = `[placeholder="${defaultMessages.components.fileSearch.byExtensionInput}"]`

describe('Specs Page', () => {
  describe('Component Workflows', {
    viewportHeight: 768,
    viewportWidth: 1024,
  }, () => {
    context('no specs', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs')
        cy.startAppServer('component')
        cy.visitApp()
      })

      it('shows create first spec page', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description').should('be.visible').and('contain', defaultMessages.createSpec.page.defaultPatternNoSpecs.component.description)

        cy.findAllByTestId('card').eq(0).as('ComponentCard').within(() => {
          cy.findByRole('heading', { level: 2, name: defaultMessages.createSpec.component.importFromComponent.header }).should('be.visible')
          cy.contains(defaultMessages.createSpec.component.importFromComponent.description).should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard').within(() => {
          cy.findByRole('heading', { level: 2, name: defaultMessages.createSpec.component.importFromStory.header }).should('be.visible')
          cy.contains(defaultMessages.createSpec.component.importFromStory.description).should('be.visible')
        })

        cy.findByTestId('no-specs-message').should('be.visible').and('contain', defaultMessages.createSpec.noSpecsMessage)

        cy.findByRole('link', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
      })
    })
  })

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

        cy.validateExternalLink({ name: `${defaultMessages.links.needHelp}?`, href: 'https://on.cypress.io' })
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
        const spec = (
          await ctx.project.findSpecs(ctx.currentProject ?? '', 'component', '**/*.cy.jsx')
        ).find((spec) => spec.relative === 'src/stories/Button.cy.jsx')

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
        const spec = (await ctx.project.findSpecs(ctx.currentProject ?? '', 'component', '**/*.cy.jsx'))
        .find((spec) => spec.relative === 'src/stories/Button.stories.cy.jsx')

        expect(spec).to.exist
      })
    })
  })
})
