import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Specs Page', () => {
  describe('Component Workflows', {
    viewportHeight: 768,
    viewportWidth: 1024,
  }, () => {
    context('with storybook', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs')
        cy.startAppServer('component')
        cy.visitApp()

        // With no specs present, the page renders two cards, one for creating from found components,
        // another for creating from found stories.
        cy.findAllByTestId('card').eq(0).as('ComponentCard')
        .should('have.attr', 'tabindex', '0')
        .within(() => {
          cy.findByRole('heading', { level: 2, name: defaultMessages.createSpec.component.importFromComponent.header }).should('be.visible')
          cy.contains(defaultMessages.createSpec.component.importFromComponent.description).should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard')
        .should('have.attr', 'tabindex', '0')
        .within(() => {
          cy.findByRole('heading', { level: 2, name: defaultMessages.createSpec.component.importFromStory.header }).should('be.visible')
          cy.contains(defaultMessages.createSpec.component.importFromStory.description).should('be.visible')
        })
      })

      it('shows create first spec page with create from component and create from story options', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description').should('be.visible').and('contain', defaultMessages.createSpec.page.defaultPatternNoSpecs.component.description)

        cy.get('@ComponentCard').should('be.visible')
        cy.get('@StoryCard').should('be.visible')

        cy.findByTestId('no-specs-message').should('be.visible').and('contain', defaultMessages.createSpec.noSpecsMessage)

        cy.findByRole('link', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
      })

      context('create from story', () => {
        beforeEach(() => {
          cy.get('@StoryCard').click()

          cy.findByRole('dialog', { name: defaultMessages.createSpec.component.importFromStory.header }).as('CreateFromStoryDialog')

          cy.get('@CreateFromStoryDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
          })

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog').should('not.exist')
        })

        it('shows input for file extension filter', () => {
          cy.get('@CreateFromStoryDialog').within(() => {
            cy.findByTestId('file-match-indicator').should('contain', '1 Match')
            cy.findByRole('button', { name: '**/*.stories.*' }).click()
            cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
            .as('ExtensionInput')
            .clear()
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.get('@ExtensionInput').should('have.value', '**/*.stories.*')

            cy.findByTestId('file-match-indicator').should('contain', '1 Match')
          })
        })

        it('shows input for file name filter', () => {
          cy.get('@CreateFromStoryDialog').within(() => {
            cy.findByLabelText('file-name-input').as('FileNameInput')
            .should('have.value', '')

            cy.findByTestId('file-match-indicator').should('contain', '1 Match')

            cy.get('@FileNameInput')
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.findByTestId('file-match-indicator').should('contain', '1 Match')

            cy.get('@FileNameInput')
            .type('Button.stories.jsx')

            cy.findByTestId('file-match-indicator').should('contain', '1 of 1 Matches')
          })
        })

        it('shows success modal with spec is created from story', () => {
          cy.get('@CreateFromStoryDialog').within(() => {
            cy.findAllByTestId('file-list-row').eq(0).as('NewSpecFile')

            // TODO: assert visibility of secondary text on hover/focus when
            // item is made keyboard accessible
            // cy.get('@NewSpecFile).focus()
            // cy.findByText('src/stories/Button.stories.jsx').should('be.visible')

            cy.get('@NewSpecFile').click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).as('SuccessDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
            cy.findByRole('button', { name: 'Close' }).should('be.visible')
            cy.contains('src/stories/Button.stories.cy.jsx').should('be.visible')
            cy.findByRole('link', { name: 'Okay, run the spec' }).should('have.attr', 'href', '#/specs/runner?file=src/stories/Button.stories.cy.jsx')
            cy.findByRole('button', { name: 'Create another spec' }).click()
          })

          // 'Create a new spec' dialog presents with options when user indicates they want to create
          // another spec.
          cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
            cy.findAllByTestId('card').eq(0)
            .should('have.attr', 'tabindex', '0')

            // the storybook card remains enabled here
            cy.findAllByTestId('card').eq(1)
            .should('have.attr', 'tabindex', '0')
          })
        })
      })
    })

    context('without storybook', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs-no-storybook')
        cy.openProject('no-specs-no-storybook')
        cy.startAppServer('component')
        cy.visitApp()

        // With no specs present, the page renders two cards, one for creating from found components,
        // another for creating from found stories. The story card is disabled due to storybook not
        // being configured for the scaffolded project.
        cy.findAllByTestId('card').eq(0).as('ComponentCard')
        .should('have.attr', 'tabindex', '0')
        .within(() => {
          cy.findByRole('heading', { level: 2, name: defaultMessages.createSpec.component.importFromComponent.header }).should('be.visible')
          cy.contains(defaultMessages.createSpec.component.importFromComponent.description).should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard')
        .should('have.attr', 'tabindex', '-1')
        .within(() => {
          cy.findByRole('heading', { level: 2, name: defaultMessages.createSpec.component.importFromStory.header }).should('be.visible')
          cy.contains(defaultMessages.createSpec.component.importFromStory.notSetupDescription).should('be.visible')
        })
      })

      it('shows create first spec page with create from component option', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description').should('be.visible').and('contain', defaultMessages.createSpec.page.defaultPatternNoSpecs.component.description)

        cy.get('@ComponentCard').should('be.visible')
        cy.get('@StoryCard').should('be.visible')

        cy.findByTestId('no-specs-message').should('be.visible').and('contain', defaultMessages.createSpec.noSpecsMessage)

        cy.findByRole('link', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
      })

      context('create from component', () => {
        beforeEach(() => {
          cy.get('@ComponentCard').click()

          cy.findByRole('dialog', { name: defaultMessages.createSpec.component.importFromComponent.chooseAComponentHeader }).as('CreateFromComponentDialog')

          cy.get('@CreateFromComponentDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
          })

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog').should('not.exist')
        })

        it('shows input for file extension filter', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findByTestId('file-match-indicator').should('contain', '2 Matches')
            cy.findByRole('button', { name: '**/*.{jsx,tsx}' }).click()
            cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
            .as('ExtensionInput')
            .clear()
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.get('@ExtensionInput').should('have.value', '**/*.{jsx,tsx}')

            cy.findByTestId('file-match-indicator').should('contain', '2 Matches')
          })
        })

        it('shows input for file name filter', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findByLabelText('file-name-input').as('FileNameInput')
            .should('have.value', '')

            cy.findByTestId('file-match-indicator').should('contain', '2 Matches')

            cy.get('@FileNameInput')
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.findByTestId('file-match-indicator').should('contain', '2 Matches')

            cy.get('@FileNameInput')
            .type('App.jsx')

            cy.findByTestId('file-match-indicator').should('contain', '1 of 2 Matches')
          })
        })

        it('shows success modal with spec is created from component', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findAllByTestId('file-list-row').eq(0).as('NewSpecFile')

            // TODO: assert visibility of secondary text on hover/focus when
            // item is made keyboard accessible
            // cy.get('@NewSpecFile).focus()
            // cy.findByText('src/stories/Button.stories.jsx').should('be.visible')

            cy.get('@NewSpecFile').click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).as('SuccessDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
            cy.findByRole('button', { name: 'Close' }).should('be.visible')
            cy.findByRole('link', { name: 'Okay, run the spec' }).should('have.attr', 'href', '#/specs/runner?file=src/App.cy.jsx')
            cy.findByRole('button', { name: 'Create another spec' }).click()
          })

          // 'Create a new spec' dialog presents with options when user indicates they want to create
          // another spec.
          cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
            cy.findAllByTestId('card').eq(0)
            .should('have.attr', 'tabindex', '0')

            // the storybook card remains disabled here
            cy.findAllByTestId('card').eq(1)
            .should('have.attr', 'tabindex', '-1')
          })
        })
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

      cy.contains('Create from component').click()
      const componentGlob = '**/*.{jsx,tsx}'

      cy.findByTestId('file-match-button').contains(componentGlob)
      checkCodeGenCandidates(['App.cy.jsx', 'App.jsx', 'index.jsx', 'Button.jsx', 'Button.stories.jsx'])

      cy.intercept('query-ComponentGeneratorStepOne').as('code-gen-candidates')
      cy.findByTestId('file-match-button').click()
      cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput).clear().type('**/App.*')
      cy.wait('@code-gen-candidates')

      checkCodeGenCandidates(['App.css', 'App.cy.jsx', 'App.jsx'])

      cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput).clear().type(componentGlob, { parseSpecialCharSequences: false })
      cy.contains('Button.jsx').click()
      cy.findByTestId('file-row').contains('src/stories/Button.cy.js').click()

      cy.withCtx(async (ctx) => {
        const spec = (
          await ctx.project.findSpecs(ctx.currentProject ?? '', 'component', ['**/*.cy.jsx'], [], [])
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
        const spec = (await ctx.project.findSpecs(ctx.currentProject ?? '', 'component', ['**/*.cy.jsx'], [], []))
        .find((spec) => spec.relative === 'src/stories/Button.stories.cy.jsx')

        expect(spec).to.exist
      })
    })
  })
})
