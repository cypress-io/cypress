import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('App: Index', () => {
  describe('Testing Type: E2E', () => {
    context('project with default spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs-no-storybook')
        cy.openProject('no-specs-no-storybook')
        cy.startAppServer('e2e')
        cy.visitApp()

        // With no specs present, the page renders two cards, one for scaffolding example specs,
        // another for creating a new blank spec.
        cy.findAllByTestId('card').eq(0).as('ScaffoldCard')
        .should('have.attr', 'tabindex', '0')
        .within(() => {
          cy.findByRole('heading', {
            level: 2, name: defaultMessages.createSpec.e2e.importFromScaffold.header,
          }).should('be.visible')

          cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('EmptySpecCard')
        .should('have.attr', 'tabindex', '0')
        .within(() => {
          cy.findByRole('heading', {
            level: 2, name: defaultMessages.createSpec.e2e.importEmptySpec.header,
          }).should('be.visible')

          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.description)
          .should('be.visible')
        })
      })

      it('shows create first spec page with scaffold and create empty spec options', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description').should('be.visible')
        .and('contain', defaultMessages.createSpec.page.defaultPatternNoSpecs.e2e.description)

        cy.get('@ScaffoldCard').should('be.visible')
        cy.get('@EmptySpecCard').should('be.visible')

        cy.findByTestId('no-specs-message').should('be.visible')
        .and('contain', defaultMessages.createSpec.noSpecsMessage)

        cy.findByRole('link', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
      })

      context('scaffold examples', () => {
        const expectedScaffoldPaths = [
          'cypress/e2e/1-getting-started/todo.cy.js',
          ...([
            'actions',
            'aliasing',
            'assertions',
            'connectors',
            'cookies',
            'cypress_api',
            'files',
            'local_storage',
            'location',
            'navigation',
            'network_requests',
            'querying',
            'spies_stubs_clocks',
            'utilities',
            'viewport',
            'waiting',
            'window',
          ].map((file) => `cypress/e2e/2-advanced-examples/${file}.cy.js`)),
        ]

        it('scaffolds example files when card is clicked', () => {
          cy.get('@ScaffoldCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader,
          }).within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
            cy.findByRole('button', { name: 'Close' }).should('be.visible').as('CloseDialogButton')
          })

          cy.withCtx(async (ctx, options) => {
            const generatedSpecPaths = (await ctx.project.findSpecs(ctx.currentProject ?? '', 'e2e', ['**/*.cy.js'], [], [])).map((spec) => spec.relative)

            // Validate that all expected paths have been generated within the data context
            expect(generatedSpecPaths.filter((path) => {
              return options.expectedScaffoldPaths.includes(path)
            })).to.have.lengthOf(options.expectedScaffoldPaths.length)
          }, { expectedScaffoldPaths })

          // Dismisses dialog with close button press
          cy.get('@CloseDialogButton').click()
          cy.findByRole('dialog').should('not.exist')

          // TODO Asserts are flakey around the spec page update after scaffolding,
          // re-evaluate when https://github.com/cypress-io/cypress/pull/19619 is merged
          // expectedScaffoldPaths.forEach((spec) => {
          //   // Validate that links for each generated spec are rendered
          //   cy.get(`a[href="#/specs/runner?file=${spec}"`).should('exist')
          // })
        })

        it('dismisses scaffold dialog with action button press', () => {
          cy.get('@ScaffoldCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader,
          }).within(() => {
            cy.findByRole('button', {
              name: defaultMessages.createSpec.e2e.importFromScaffold.specsAddedButton,
            }).click()
          })

          // Dismisses dialog with close button press
          cy.findByRole('dialog').should('not.exist')
        })
      })

      context('scaffold empty spec', () => {
        it('should generate empty spec', () => {
          // Verify the modal can be closed
          cy.get('@EmptySpecCard').click()
          cy.get('body').click(0, 0)
          cy.get('[data-cy="create-spec-modal"]').should('not.exist')
          cy.get('@EmptySpecCard').click()
          cy.get('[aria-label="Close"]').click()
          cy.get('[data-cy="create-spec-modal"]').should('not.exist')
          cy.get('@EmptySpecCard').click()
          cy.contains('button', defaultMessages.components.button.cancel).click()
          cy.get('[data-cy="create-spec-modal"]').within(() => {
            cy.get('[data-cy="card"]').contains(defaultMessages.createSpec.e2e.importEmptySpec.header).click()
          })

          cy.get('input').invoke('val').should('eq', 'cypress/e2e/filename.cy.js')
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')
          cy.get('input').clear()
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')

          // Shows entered file does not match spec pattern
          cy.get('input').type('cypress/e2e/no-match')
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning)
          cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

          //Shows extension warning
          cy.get('input').clear().type('cypress/e2e/MyTest.spec.j')
          cy.intercept('mutation-EmptyGeneratorCardStepOne_MatchSpecFile', (req) => {
            if (req.body.variables.specFile === 'cypress/e2e/MyTest.spec.jx') {
              req.on('before:response', (res) => {
                res.body.data.matchesSpecPattern = true
              })
            }
          })

          cy.get('input').type('x')
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.specExtensionWarning)
          cy.contains('span', '{filename}.cy.jx')

          // Create spec
          cy.get('input').clear().type('cypress/e2e/MyTest.cy.js')
          cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
          cy.contains('h2', defaultMessages.createSpec.successPage.header)

          cy.get('[data-cy="file-row"]').contains('cypress/e2e/MyTest.cy.js').click()

          // TODO: code rendering is flaky in CI
          // cy.get('code').should('contain', 'describe(\'MyTest.cy.js\'')

          cy.get('[aria-label="Close"]').click()

          cy.visitApp().get('[data-cy="specs-list-row"]').contains('MyTest.cy.js')
        })
      })
    })

    context('project with custom spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs-custom-pattern')
        cy.openProject('no-specs-custom-pattern')

        // set preferred editor to bypass IDE selection dialog
        cy.withCtx((ctx) => {
          ctx.coreData.localSettings.availableEditors = [
            ...ctx.coreData.localSettings.availableEditors,
            {
              id: 'test-editor',
              binary: '/usr/bin/test-editor',
              name: 'Test editor',
            },
          ]

          ctx.coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
        })

        cy.startAppServer('e2e')
        cy.visitApp()
      })

      it('shows No Specs page with specPattern from config', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.customPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description')
        .should('be.visible')
        .and('contain', defaultMessages.createSpec.page.customPatternNoSpecs.description.split('{0}')[0])

        cy.findByTestId('file-match-indicator').should('contain', '0 Matches')
        cy.findByRole('button', { name: 'cypress.config.js' })
        cy.findByTestId('spec-pattern').should('contain', 'src/**/*.cy.{js,jsx}')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern)
        cy.findByRole('button', { name: 'New Spec', exact: false })
      })

      it('opens config file in ide from SpecPattern', () => {
        cy.intercept('mutation-OpenConfigFile', { data: { 'openFileInIDE': true } }).as('OpenIDE')

        cy.findByRole('button', { name: 'cypress.config.js' }).click()

        cy.wait('@OpenIDE')
      })

      it('opens config file in ide from footer button', () => {
        cy.intercept('mutation-OpenConfigFile', { data: { 'openFileInIDE': true } }).as('OpenIDE')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern).click()

        cy.wait('@OpenIDE')
      })

      it('shows new spec button to start creation workflow', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .should('have.attr', 'tabindex', '0')
          .and('contain', defaultMessages.createSpec.e2e.importFromScaffold.header)

          cy.findAllByTestId('card').eq(1)
          .should('have.attr', 'tabindex', '0')
          .and('contain', defaultMessages.createSpec.e2e.importEmptySpec.header)
        })
      })
    })
  })

  describe('Testing Type: Component', {
    viewportHeight: 768,
    viewportWidth: 1024,
  }, () => {
    context('project with storybook', () => {
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
          cy.findByRole('heading', {
            level: 2,
            name: defaultMessages.createSpec.component.importFromComponent.header,
          }).should('be.visible')

          cy.contains(defaultMessages.createSpec.component.importFromComponent.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard')
        .should('have.attr', 'tabindex', '0')
        .within(() => {
          cy.findByRole('heading', {
            level: 2,
            name: defaultMessages.createSpec.component.importFromStory.header,
          }).should('be.visible')

          cy.contains(defaultMessages.createSpec.component.importFromStory.description)
          .should('be.visible')
        })
      })

      it('shows create first spec page with create from component and create from story options', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description')
        .should('be.visible')
        .and('contain', defaultMessages.createSpec.page.defaultPatternNoSpecs.component.description)

        cy.get('@ComponentCard').should('be.visible')
        cy.get('@StoryCard').should('be.visible')

        cy.findByTestId('no-specs-message')
        .should('be.visible')
        .and('contain', defaultMessages.createSpec.noSpecsMessage)

        cy.findByRole('link', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
      })

      context('create from story', () => {
        beforeEach(() => {
          cy.get('@StoryCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.component.importFromStory.header,
          }).as('CreateFromStoryDialog')

          cy.get('@CreateFromStoryDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
          })

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows story dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog').should('not.exist')
        })

        it('shows input for file extension filter', () => {
          cy.get('@CreateFromStoryDialog').within(() => {
            cy.findByTestId('file-match-indicator').should('contain', '1 Match')
            cy.findByRole('button', { name: '*.stories.*' }).click()
            cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
            .as('ExtensionInput')
            .clear()
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.get('@ExtensionInput').should('have.value', '*.stories.*')

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

        it('shows success modal when spec is created from story', () => {
          cy.get('@CreateFromStoryDialog').within(() => {
            cy.findAllByTestId('file-list-row').eq(0).as('NewSpecFile')

            // TODO: assert visibility of secondary text on hover/focus when
            // item is made keyboard accessible
            // https://cypress-io.atlassian.net/browse/UNIFY-864
            // cy.get('@NewSpecFile).focus()
            // cy.findByText('src/stories/Button.stories.jsx').should('be.visible')

            cy.get('@NewSpecFile').click()
          })

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.successPage.header,
          }).as('SuccessDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
            cy.findByRole('button', { name: 'Close' }).should('be.visible')
            cy.contains('src/stories/Button.stories.cy.jsx').should('be.visible')

            cy.findByRole('link', { name: 'Okay, run the spec' })
            .should('have.attr', 'href', '#/specs/runner?file=src/stories/Button.stories.cy.jsx')

            cy.findByRole('button', { name: 'Create another spec' }).click()
          })

          // 'Create a new spec' dialog presents with options when user indicates they want to create
          // another spec.
          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.newSpecModalTitle,
          }).within(() => {
            cy.findAllByTestId('card').eq(0)
            .should('have.attr', 'tabindex', '0')

            // the storybook card remains enabled here
            cy.findAllByTestId('card').eq(1)
            .should('have.attr', 'tabindex', '0')
          })
        })
      })
    })

    context('project without storybook', () => {
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
          cy.findByRole('heading', {
            level: 2, name: defaultMessages.createSpec.component.importFromComponent.header,
          }).should('be.visible')

          cy.contains(defaultMessages.createSpec.component.importFromComponent.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard')
        .should('have.attr', 'tabindex', '-1')
        .within(() => {
          cy.findByRole('heading', {
            level: 2, name: defaultMessages.createSpec.component.importFromStory.header,
          }).should('be.visible')

          cy.contains(defaultMessages.createSpec.component.importFromStory.notSetupDescription)
          .should('be.visible')
        })
      })

      it('shows create first spec page with create from component option', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description').should('be.visible')
        .and('contain', defaultMessages.createSpec.page.defaultPatternNoSpecs.component.description)

        cy.get('@ComponentCard').should('be.visible')
        cy.get('@StoryCard').should('be.visible')

        cy.findByTestId('no-specs-message').should('be.visible')
        .and('contain', defaultMessages.createSpec.noSpecsMessage)

        cy.findByRole('link', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .and('have.attr', 'href', '#/settings?section=project&setting=specPattern')
      })

      context('create from component', () => {
        beforeEach(() => {
          cy.get('@ComponentCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.component.importFromComponent.chooseAComponentHeader,
          }).as('CreateFromComponentDialog')

          cy.get('@CreateFromComponentDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
          })

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows component dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog').should('not.exist')
        })

        it('shows input for file extension filter', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.log('testing builds')
            cy.findByTestId('file-match-indicator').should('contain', '2 Matches')
            cy.findByRole('button', { name: '*.{jsx,tsx}' }).click()
            cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
            .as('ExtensionInput')
            .clear()
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.get('@ExtensionInput').should('have.value', '*.{jsx,tsx}')

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

        it('shows success modal when spec is created from component', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findAllByTestId('file-list-row').eq(0).as('NewSpecFile')

            // TODO: assert visibility of secondary text on hover/focus when
            // item is made keyboard accessible
            // https://cypress-io.atlassian.net/browse/UNIFY-864
            // cy.get('@NewSpecFile).focus()
            // cy.findByText('src/stories/Button.stories.jsx').should('be.visible')

            cy.get('@NewSpecFile').click()
          })

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.successPage.header,
          }).as('SuccessDialog').within(() => {
            cy.validateExternalLink({ name: 'Need help?', href: 'https://on.cypress.io' })
            cy.contains('src/App.cy.jsx').should('be.visible')
            cy.findByRole('button', { name: 'Close' }).should('be.visible')

            cy.findByRole('link', { name: 'Okay, run the spec' })
            .should('have.attr', 'href', '#/specs/runner?file=src/App.cy.jsx')

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

        // TODO: Generated spec is no longer found by runner, need to determine why
        it.skip('navigates to spec runner when selected', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findAllByTestId('file-list-row').eq(0).as('NewSpecFile')
            cy.get('@NewSpecFile').click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).as('SuccessDialog').within(() => {
            cy.findByRole('link', {
              name: 'Okay, run the spec',
            }).should('have.attr', 'href', '#/specs/runner?file=src/App.cy.jsx').click()
          })

          cy.findByTestId('spec-gen-component-app', { timeout: 5000 }).should('be.visible')
        })
      })
    })

    context('project with custom spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs-custom-pattern')
        cy.openProject('no-specs-custom-pattern')

        // set preferred editor to bypass IDE selection dialog
        cy.withCtx((ctx) => {
          ctx.coreData.localSettings.availableEditors = [
            ...ctx.coreData.localSettings.availableEditors,
            {
              id: 'test-editor',
              binary: '/usr/bin/test-editor',
              name: 'Test editor',
            },
          ]

          ctx.coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
        })

        cy.startAppServer('component')
        cy.visitApp()
      })

      it('shows No Specs page with specPattern from config', () => {
        cy.findByRole('heading', {
          level: 1,
          name: defaultMessages.createSpec.page.customPatternNoSpecs.title,
        }).should('be.visible')

        cy.findByTestId('create-spec-page-description')
        .should('be.visible')
        .and('contain', defaultMessages.createSpec.page.customPatternNoSpecs.description.split('{0}')[0])

        cy.findByTestId('file-match-indicator').should('contain', '0 Matches')
        cy.findByRole('button', { name: 'cypress.config.js' })
        cy.findByTestId('spec-pattern').should('contain', 'src/**/*.cy.{js,jsx}')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern)
        cy.findByRole('button', { name: 'New Spec', exact: false })
      })

      it('opens config file in ide from SpecPattern', () => {
        cy.intercept('mutation-OpenConfigFile', { data: { 'openFileInIDE': true } }).as('OpenIDE')

        cy.findByRole('button', { name: 'cypress.config.js' }).click()

        cy.wait('@OpenIDE')
      })

      it('opens config file in ide from footer button', () => {
        cy.intercept('mutation-OpenConfigFile', { data: { 'openFileInIDE': true } }).as('OpenIDE')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern).click()

        cy.wait('@OpenIDE')
      })

      it('shows new spec button to start creation workflow', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .should('have.attr', 'tabindex', '0')
          .and('contain', defaultMessages.createSpec.component.importFromComponent.description)

          cy.findAllByTestId('card').eq(1)
          .should('have.attr', 'tabindex', '0')
          .and('contain', defaultMessages.createSpec.component.importFromStory.description)
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
        const componentGlob = '*.{jsx,tsx}'

        cy.findByTestId('file-match-button').contains(componentGlob)
        checkCodeGenCandidates(['App.cy.jsx', 'App.jsx', 'index.jsx', 'Button.jsx', 'Button.stories.jsx'])

        cy.intercept('query-ComponentGeneratorStepOne').as('code-gen-candidates')
        cy.findByTestId('file-match-button').click()
        cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput).clear().type('App.*')
        cy.wait('@code-gen-candidates')

        checkCodeGenCandidates(['App.css', 'App.cy.jsx', 'App.jsx'])

        cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
        .clear().type(componentGlob, { parseSpecialCharSequences: false })

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
        const storyGlob = '*.stories.*'

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
})
