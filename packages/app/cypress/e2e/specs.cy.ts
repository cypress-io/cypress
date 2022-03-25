import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { getPathForPlatform } from '../../src/paths'
import { getRunnerHref } from './support/get-runner-href'

describe('App: Index', () => {
  describe('Testing Type: E2E', () => {
    context('js project with default spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs-no-storybook')
        cy.openProject('no-specs-no-storybook')
        cy.startAppServer('e2e')
        cy.__incorrectlyVisitAppWithIntercept()

        // With no specs present, the page renders two cards, one for scaffolding example specs,
        // another for creating a new blank spec.
        cy.findAllByTestId('card').eq(0).as('ScaffoldCard')
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.e2e.importFromScaffold.header,
          }).should('be.visible')
          .and('not.be.disabled')

          cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('EmptySpecCard')
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.e2e.importEmptySpec.header,
          }).should('be.visible')
          .and('not.be.disabled')

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

        cy.findByRole('button', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .click()

        cy.findByRole('dialog', {
          name: defaultMessages.components.specPatternModal.title,
        }).should('be.visible').within(() => {
          cy.validateExternalLink({ name: 'Need help', href: 'https://on.cypress.io/test-type-options' })
          cy.findByRole('button', { name: 'Close' }).should('be.visible').as('CloseDialogButton')
          cy.get('[data-cy="file-match-indicator"]').contains('0 Matches')
          cy.get('[data-cy="spec-pattern"]').contains('cypress/e2e/**/*.cy.{js,jsx,ts,tsx}')
        })

        cy.get('@CloseDialogButton').click()
        cy.findByRole('dialog').should('not.exist')
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
        ].map(getPathForPlatform)

        it('scaffolds example files when card is clicked', () => {
          cy.get('@ScaffoldCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader,
          }).within(() => {
            cy.findByRole('button', { name: 'Close' }).should('be.visible').as('CloseDialogButton')
          })

          cy.withCtx(async (ctx, options) => {
            const generatedSpecPaths = (await ctx.project.findSpecs(ctx.currentProject ?? '', 'e2e', ['**/*.cy.js'], [], [])).map((spec) => spec.relative)

            // Validate that all expected paths have been generated within the data context
            expect(generatedSpecPaths.filter((path) => {
              return options.expectedScaffoldPaths.includes(path)
            })).to.have.lengthOf(options.expectedScaffoldPaths.length)
          }, { expectedScaffoldPaths })

          cy.percySnapshot()

          // Dismisses dialog with close button press
          cy.get('@CloseDialogButton').click()
          cy.findByRole('dialog').should('not.exist')

          expectedScaffoldPaths.forEach((spec) => {
            // Validate that links for each generated spec are rendered
            cy.get(`a[href="#/${getRunnerHref(spec)}"`).scrollIntoView().should('exist')
          })
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
          cy.contains('button', defaultMessages.components.button.back).click()
          cy.get('[data-cy="create-spec-modal"]').within(() => {
            cy.get('[data-cy="card"]').contains(defaultMessages.createSpec.e2e.importEmptySpec.header).click()
          })

          cy.percySnapshot('Default')

          cy.findAllByLabelText(defaultMessages.createSpec.e2e.importEmptySpec.inputPlaceholder)
          .as('enterSpecInput')

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('cypress/e2e/filename.cy.js'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')
          cy.get('@enterSpecInput').clear()
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')

          // Shows entered file does not match spec pattern
          cy.get('@enterSpecInput').type(getPathForPlatform('cypress/e2e/no-match'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning)
          cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

          cy.percySnapshot('Invalid spec error')

          // Create spec
          cy.get('@enterSpecInput').clear().type(getPathForPlatform('cypress/e2e/MyTest.cy.js'))
          cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
          cy.contains('h2', defaultMessages.createSpec.successPage.header)

          cy.get('[data-cy="file-row"]').contains(getPathForPlatform('cypress/e2e/MyTest.cy.js')).click()

          cy.get('pre').should('contain', 'describe(\'MyTest.cy.js\'')

          cy.percySnapshot('Generator success')

          cy.get('[aria-label="Close"]').click()

          cy.visitApp().get('[data-cy="spec-list-file"]').contains('MyTest.cy.js')
        })
      })
    })

    context('ts project with default spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs-no-storybook')
        cy.openProject('no-specs-no-storybook')

        cy.withCtx(async (ctx) => {
          await ctx.actions.file.writeFileInProject('tsconfig.json', '{}')
        })

        cy.openProject('no-specs-no-storybook')

        cy.startAppServer('e2e')
        cy.__incorrectlyVisitAppWithIntercept()

        // With no specs present, the page renders two cards, one for scaffolding example specs,
        // another for creating a new blank spec.
        cy.findAllByTestId('card').eq(0).as('ScaffoldCard')
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.e2e.importFromScaffold.header,
          }).should('be.visible')
          .and('not.be.disabled')

          cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('EmptySpecCard')
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.e2e.importEmptySpec.header,
          }).should('be.visible')
          .and('not.be.disabled')

          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.description)
          .should('be.visible')
        })
      })

      context('scaffold empty spec', () => {
        it('should generate empty spec for a TS project', () => {
          // Verify the modal can be closed
          cy.get('@EmptySpecCard').click()
          cy.get('body').click(0, 0)
          cy.get('[data-cy="create-spec-modal"]').should('not.exist')
          cy.get('@EmptySpecCard').click()
          cy.get('[aria-label="Close"]').click()
          cy.get('[data-cy="create-spec-modal"]').should('not.exist')
          cy.get('@EmptySpecCard').click()
          cy.contains('button', defaultMessages.components.button.back).click()
          cy.get('[data-cy="create-spec-modal"]').within(() => {
            cy.get('[data-cy="card"]').contains(defaultMessages.createSpec.e2e.importEmptySpec.header).click()
          })

          cy.percySnapshot('Default')

          cy.findAllByLabelText(defaultMessages.createSpec.e2e.importEmptySpec.inputPlaceholder)
          .as('enterSpecInput')

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('cypress/e2e/filename.cy.ts'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')
          cy.get('@enterSpecInput').clear()
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')

          // Shows entered file does not match spec pattern
          cy.get('@enterSpecInput').type(getPathForPlatform('cypress/e2e/no-match'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning)
          cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

          cy.percySnapshot('Invalid spec error')

          // Create spec
          cy.get('@enterSpecInput').clear().type(getPathForPlatform('cypress/e2e/MyTest.cy.ts'))
          cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
          cy.contains('h2', defaultMessages.createSpec.successPage.header)

          cy.get('[data-cy="file-row"]').contains(getPathForPlatform('cypress/e2e/MyTest.cy.ts')).click()

          cy.percySnapshot('Generator success')

          cy.get('pre').should('contain', 'describe(\'MyTest.cy.ts\'')

          cy.get('[aria-label="Close"]').click()

          cy.visitApp().get('[data-cy="spec-list-file"]').contains('MyTest.cy.ts')
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
        cy.__incorrectlyVisitAppWithIntercept()
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
        cy.findByTestId('spec-pattern').should('contain', 'src/**/*.{cy,spec}.{js,jsx}')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern)
        cy.findByRole('button', { name: 'New Spec', exact: false })
      })

      it('opens config file in ide from SpecPattern', () => {
        cy.intercept('mutation-OpenFileInIDE_Mutation', { data: { openFileInIDE: true } }).as('OpenIDE')

        cy.findByRole('button', { name: 'cypress.config.js' }).click()

        cy.wait('@OpenIDE')
      })

      it('opens config file in ide from footer button', () => {
        cy.intercept('mutation-OpenFileInIDE_Mutation', { data: { openFileInIDE: true } }).as('OpenIDE')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern).click()

        cy.wait('@OpenIDE')
      })

      it('shows new spec button to start creation workflow', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .and('contain', defaultMessages.createSpec.e2e.importFromScaffold.header)

          cy.findAllByTestId('card').eq(1)
          .and('contain', defaultMessages.createSpec.e2e.importEmptySpec.header)
        })
      })

      context('scaffold empty spec', () => {
        it('should generate empty spec', () => {
          cy.findByRole('button', { name: 'New Spec', exact: false }).click()

          cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
            cy.findAllByTestId('card').eq(0)
            .and('contain', defaultMessages.createSpec.e2e.importFromScaffold.header)

            cy.findAllByTestId('card').eq(1)
            .and('contain', defaultMessages.createSpec.e2e.importEmptySpec.header)
          })

          cy.contains('Create new empty spec').click()

          cy.findAllByLabelText(defaultMessages.createSpec.e2e.importEmptySpec.inputPlaceholder)
          .as('enterSpecInput')

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('src/filename.cy.js'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')
          cy.get('@enterSpecInput').clear()
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')

          // Shows entered file does not match spec pattern
          cy.get('@enterSpecInput').type(getPathForPlatform('cypress/e2e/no-match'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning)
          cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

          cy.percySnapshot('Invalid spec error')

          // Create spec
          cy.get('@enterSpecInput').clear().type(getPathForPlatform('src/MyTest.cy.js'))
          cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
          cy.contains('h2', defaultMessages.createSpec.successPage.header)

          cy.get('[data-cy="file-row"]').contains(getPathForPlatform('src/MyTest.cy.js')).click()

          cy.get('pre').should('contain', 'describe(\'MyTest.cy.js\'')

          cy.percySnapshot('Generator success')

          cy.get('[aria-label="Close"]').click()

          cy.visitApp().get('[data-cy-row]').contains('MyTest.cy.js')
        })
      })

      it('shows extension warning', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .and('contain', defaultMessages.createSpec.e2e.importFromScaffold.header)

          cy.findAllByTestId('card').eq(1)
          .and('contain', defaultMessages.createSpec.e2e.importEmptySpec.header)
        })

        cy.contains('Create new empty spec').click()

        cy.findAllByLabelText(defaultMessages.createSpec.e2e.importEmptySpec.inputPlaceholder)
        .as('enterSpecInput')

        cy.get('@enterSpecInput').clear().type(getPathForPlatform('src/e2e/MyTest.spec.j'))
        cy.intercept('mutation-EmptyGenerator_MatchSpecFile', (req) => {
          if (req.body.variables.specFile === getPathForPlatform('src/e2e/MyTest.spec.jx')) {
            req.on('before:response', (res) => {
              res.body.data.matchesSpecPattern = true
            })
          }
        })

        cy.get('@enterSpecInput').type('x')
        cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.specExtensionWarning)
        cy.percySnapshot('Non-recommended spec pattern warning')
        cy.contains('span', '{filename}.cy.jx')
      })
    })

    context('pristine app', () => {
      beforeEach(() => {
        cy.scaffoldProject('pristine-with-e2e-testing')
        cy.openProject('pristine-with-e2e-testing')
        cy.startAppServer('e2e')
        cy.visitApp()
      })

      context('scaffold example files', () => {
        it('should create example files on an empty project', () => {
          cy.contains('[data-cy="card"]', defaultMessages.createSpec.e2e.importFromScaffold.header).click()

          cy.get('[data-cy="create-spec-modal"] a').should('have.attr', 'href').and('eq', 'https://on.cypress.io/writing-and-organizing-tests')

          cy.withCtx(async (ctx, o) => {
            const stats = await ctx.actions.file.checkIfFileExists(o.path)

            expect(stats?.isFile()).to.be.true
          }, { path: getPathForPlatform('cypress/e2e/1-getting-started/todo.cy.js') })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader }).should('be.visible')
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
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.component.importFromComponent.header,
          }).should('be.visible')
          .and('not.be.disabled')

          cy.contains(defaultMessages.createSpec.component.importFromComponent.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard')
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.component.importFromStory.header,
          }).should('be.visible')
          .and('not.be.disabled')

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

        cy.findByRole('button', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
        .click()

        cy.findByRole('dialog', {
          name: defaultMessages.components.specPatternModal.title,
        }).should('be.visible').within(() => {
          cy.validateExternalLink({ name: 'Need help', href: 'https://on.cypress.io/test-type-options' })
          cy.findByRole('button', { name: 'Close' }).should('be.visible').as('CloseDialogButton')
          cy.get('[data-cy="file-match-indicator"]').contains('0 Matches')
          cy.get('[data-cy="spec-pattern"]').contains('**/*.cy.{js,jsx,ts,tsx}')
        })

        cy.get('@CloseDialogButton').click()
        cy.findByRole('dialog').should('not.exist')
      })

      context('create from story', () => {
        beforeEach(() => {
          cy.get('@StoryCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.component.importFromStory.header,
          }).as('CreateFromStoryDialog')

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows story dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog').should('not.exist')
        })

        it('shows input for file extension filter', () => {
          cy.get('@CreateFromStoryDialog').within(() => {
            cy.findByTestId('file-match-indicator').should('contain', '1 Match')
            cy.percySnapshot('Create from story generator')
            cy.findByRole('button', { name: '*.stories.*' }).click()
            cy.percySnapshot('File list search dropdown')
            cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
            .as('ExtensionInput')
            .clear()
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')
            cy.percySnapshot('No Results')

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
            cy.percySnapshot()
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

          cy.percySnapshot()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.successPage.header,
          }).as('SuccessDialog').within(() => {
            cy.findByRole('button', { name: 'Close' }).should('be.visible')
            cy.contains(getPathForPlatform('src/stories/Button.stories.cy.jsx')).should('be.visible')

            cy.findByRole('link', { name: 'Okay, run the spec' })
            .should('have.attr', 'href', `#/${getRunnerHref('src/stories/Button.stories.cy.jsx')}`)

            cy.findByRole('button', { name: 'Create another spec' }).click()
          })

          // 'Create a new spec' dialog presents with options when user indicates they want to create
          // another spec.
          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.newSpecModalTitle,
          }).within(() => {
            cy.findAllByTestId('card').eq(0)

            // the storybook card remains enabled here
            cy.contains('button', defaultMessages.createSpec.component.importFromStory.header)
            .should('not.be.disabled')
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
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.component.importFromComponent.header,
          }).should('be.visible')
          .and('not.be.disabled')

          cy.contains(defaultMessages.createSpec.component.importFromComponent.description)
          .should('be.visible')
        })

        cy.findAllByTestId('card').eq(1).as('StoryCard')
        .within(() => {
          cy.findByRole('button', {
            name: defaultMessages.createSpec.component.importFromStory.header,
          }).should('be.visible')
          .and('be.disabled')

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

        cy.findByRole('button', { name: defaultMessages.createSpec.viewSpecPatternButton })
        .should('be.visible')
        .and('not.be.disabled')
      })

      context('create from component', () => {
        beforeEach(() => {
          cy.get('@ComponentCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.component.importFromComponent.chooseAComponentHeader,
          }).as('CreateFromComponentDialog')

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows component dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog').should('not.exist')
        })

        it('shows input for file extension filter', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.log('testing builds')
            cy.findByTestId('file-match-indicator').should('contain', '4 Matches')
            cy.findByRole('button', { name: '*.{js,jsx,tsx}' }).click()
            cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
            .as('ExtensionInput')
            .clear()
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.get('@ExtensionInput').should('have.value', '*.{js,jsx,tsx}')

            cy.findByTestId('file-match-indicator').should('contain', '4 Matches')
          })
        })

        it('shows input for file name filter', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findByLabelText('file-name-input').as('FileNameInput')
            .should('have.value', '')

            cy.findByTestId('file-match-indicator').should('contain', '4 Matches')

            cy.get('@FileNameInput')
            .type('foobar')

            cy.findByTestId('file-match-indicator').should('contain', 'No Matches')

            cy.findByTestId('no-results-clear').click()

            cy.findByTestId('file-match-indicator').should('contain', '4 Matches')

            cy.get('@FileNameInput')
            .type('App.jsx')

            cy.findByTestId('file-match-indicator').should('contain', '1 of 4 Matches')
          })
        })

        it('shows success modal when spec is created from component', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findByLabelText('file-name-input').focus().type('App.jsx')

            // TODO: assert visibility of secondary text on hover/focus when
            // item is made keyboard accessible
            // https://cypress-io.atlassian.net/browse/UNIFY-864
            // cy.contains('file-list-row', 'App.jsx').focus()
            // cy.findByText('src/stories/App.jsx').should('be.visible')

            cy.findAllByTestId('file-list-row').contains('App.jsx').click()
          })

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.successPage.header,
          }).as('SuccessDialog').within(() => {
            cy.contains(getPathForPlatform('src/App.cy.jsx')).should('be.visible')
            cy.findByRole('button', { name: 'Close' }).should('be.visible')

            cy.findByRole('link', { name: 'Okay, run the spec' })
            .should('have.attr', 'href', `#/${getRunnerHref('src/App.cy.jsx')}`)

            cy.findByRole('button', { name: 'Create another spec' }).click()
          })

          // 'Create a new spec' dialog presents with options when user indicates they want to create
          // another spec.
          cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
            cy.findAllByTestId('card').eq(0)

            // the storybook card remains disabled here
            cy.contains('button', defaultMessages.createSpec.component.importFromStory.header)
            .should('be.disabled')
          })
        })

        it('navigates to spec runner when selected', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findByLabelText('file-name-input').focus().type('App.jsx')
            cy.findAllByTestId('file-list-row').contains('App.jsx').click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).within(() => {
            cy.findByRole('link', {
              name: 'Okay, run the spec',
            }).should('have.attr', 'href', `#/${getRunnerHref('src/App.cy.jsx')}`).click()
          })

          cy.get('#main-pane').should('be.visible')

          cy.location().its('href').should('contain', `#/${getRunnerHref('src/App.cy.jsx')}`)
        })

        it('displays alert with docs link on new spec', () => {
          cy.get('@CreateFromComponentDialog').within(() => {
            cy.findByLabelText('file-name-input').focus().type('App.jsx')
            cy.findAllByTestId('file-list-row').contains('App.jsx').click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).as('SuccessDialog').within(() => {
            cy.findByRole('link', {
              name: 'Okay, run the spec',
            }).should('have.attr', 'href', `#/${getRunnerHref('src/App.cy.jsx')}`).click()
          })

          cy.contains('Review the docs')
          .should('have.attr', 'href', 'https://on.cypress.io/mount')
        })

        it('stops showing alert after navigating', () => {
          cy.get('@CreateFromComponentDialog').findAllByTestId('file-list-row').first().click()

          cy.log('create a second spec')

          cy.contains('Create another spec').click()
          cy.contains('Create from component').click()
          cy.get('@CreateFromComponentDialog').findAllByTestId('file-list-row').last().click()
          cy.contains('Okay, run the spec').click()

          cy.get('#spec-runner-header').should('contain', 'Review the docs')

          cy.log('should not contain the link if you navigate away and back')

          cy.get('[data-testid=spec-file-item]').first().click()
          cy.get('#spec-runner-header').should('not.contain', 'Review the docs')

          cy.get('[data-testid=spec-file-item]').last().click()
          cy.get('#spec-runner-header').should('not.contain', 'Review the docs')
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
        cy.__incorrectlyVisitAppWithIntercept()
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
        cy.findByTestId('spec-pattern').should('contain', 'src/specs-folder/*.cy.{js,jsx}')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern)
        cy.findByRole('button', { name: 'New Spec', exact: false })
      })

      it('opens config file in ide from SpecPattern', () => {
        cy.intercept('mutation-OpenFileInIDE_Mutation', { data: { openFileInIDE: true } }).as('OpenIDE')

        cy.findByRole('button', { name: 'cypress.config.js' }).click()

        cy.wait('@OpenIDE')
      })

      it('opens config file in ide from footer button', () => {
        cy.intercept('mutation-OpenFileInIDE_Mutation', { data: { openFileInIDE: true } }).as('OpenIDE')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern).click()

        cy.wait('@OpenIDE')
      })

      it('shows new spec button to start creation workflow', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .and('contain', defaultMessages.createSpec.component.importFromComponent.description)

          cy.findAllByTestId('card').eq(1)
          .and('contain', defaultMessages.createSpec.component.importFromStory.description)
        })
      })

      it('shows create first spec page with create from component option and goes back if it is cancel', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .and('contain', defaultMessages.createSpec.component.importFromComponent.description).click()
        })

        cy.get('[data-cy=file-list-row]').contains('App.jsx').click()

        cy.get('input').invoke('val').should('eq', getPathForPlatform('src/App.cy.jsx'))
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.header)

        cy.contains(defaultMessages.components.button.back).click()

        cy.contains(defaultMessages.createSpec.newSpecModalTitle)
      })

      it('shows create first spec page with create from component option', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(0)
          .and('contain', defaultMessages.createSpec.component.importFromComponent.description).click()
        })

        cy.get('[data-cy=file-list-row]').contains('App.jsx').click()

        cy.get('input').invoke('val').should('eq', getPathForPlatform('src/App.cy.jsx'))
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.header)
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.invalidComponentWarning)
        cy.get('input').clear()
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.invalidComponentWarning).should('not.exist')
        cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

        cy.get('input').clear().type(getPathForPlatform('src/specs-folder/MyTest.cy.jsx'))
        cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
        cy.contains('h2', defaultMessages.createSpec.successPage.header)

        cy.get('[data-cy="file-row"]').contains(getPathForPlatform('src/specs-folder/MyTest.cy.jsx')).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).as('SuccessDialog').within(() => {
          cy.findByRole('link', {
            name: 'Okay, run the spec',
          }).should('have.attr', 'href', `#/${getRunnerHref('src/specs-folder/MyTest.cy.jsx')}`)
        })
      })

      it('shows create first spec page with create from story option', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.newSpecModalTitle }).within(() => {
          cy.findAllByTestId('card').eq(1)
          .and('contain', defaultMessages.createSpec.component.importFromStory.description).click()
        })

        cy.get('[data-cy=file-list-row]').first().click()

        cy.get('input').invoke('val').should('eq', getPathForPlatform('src/stories/Button.stories.cy.jsx'))
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.header)
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.invalidComponentWarning)
        cy.get('input').clear()
        cy.contains(defaultMessages.createSpec.component.importEmptySpec.invalidComponentWarning).should('not.exist')
        cy.contains('button', defaultMessages.createSpec.createSpec).should('be.disabled')

        cy.get('input').clear().type(getPathForPlatform('src/specs-folder/Button.stories.cy.jsx'))
        cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
        cy.contains('h2', defaultMessages.createSpec.successPage.header)

        cy.get('[data-cy="file-row"]').contains(getPathForPlatform('src/specs-folder/Button.stories.cy.jsx')).click()

        cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).as('SuccessDialog').within(() => {
          cy.findByRole('link', {
            name: 'Okay, run the spec',
          }).should('have.attr', 'href', `#/${getRunnerHref('src/specs-folder/Button.stories.cy.jsx')}`)
        })
      })
    })

    describe('Code Generation', () => {
      beforeEach(() => {
        cy.scaffoldProject('react-code-gen')
        cy.openProject('react-code-gen')
        cy.startAppServer('component')
        cy.__incorrectlyVisitAppWithIntercept()
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
        })

        cy.contains('Create from component').click()
        const componentGlob = '*.{js,jsx,tsx}'

        cy.findByTestId('file-match-button').contains(componentGlob)
        cy.percySnapshot('Component Generator')
        checkCodeGenCandidates(['cypress.config.js', 'App.cy.jsx', 'App.jsx', 'index.jsx', 'support.js', 'Button.jsx', 'Button.stories.jsx'])

        cy.intercept('query-ComponentGeneratorStepOne').as('code-gen-candidates')
        cy.findByTestId('file-match-button').click()
        cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput).clear().type('App.*')
        cy.wait('@code-gen-candidates')

        checkCodeGenCandidates(['App.css', 'App.cy.jsx', 'App.jsx'])

        cy.findByPlaceholderText(defaultMessages.components.fileSearch.byExtensionInput)
        .clear().type(componentGlob, { parseSpecialCharSequences: false })

        cy.contains('Button.jsx').click()
        cy.findByTestId('file-row').contains(getPathForPlatform('src/stories/Button.cy.js')).click()
        cy.percySnapshot('Component Generator Success')

        cy.withCtx(async (ctx, o) => {
          const spec = (
            await ctx.project.findSpecs(ctx.currentProject ?? '', 'component', ['**/*.cy.jsx'], [], [])
          ).find((spec) => spec.relative === o.path)

          expect(spec).to.exist
        }, { path: getPathForPlatform('src/stories/Button.cy.jsx') })
      })

      it('should generate spec from story', () => {
        cy.findByTestId('new-spec-button').click()

        cy.contains('Create from story').click()
        const storyGlob = '*.stories.*'

        cy.findByTestId('file-match-button').contains(storyGlob)
        cy.percySnapshot('Story Generator')
        checkCodeGenCandidates(['Button.stories.jsx'])

        cy.contains('Button.stories.jsx').click()
        cy.findByTestId('file-row').contains(getPathForPlatform('src/stories/Button.stories.cy.js')).click()
        cy.contains('composeStories')
        cy.contains('ExampleWithLongName')
        cy.percySnapshot('Story Generator Success')

        cy.withCtx(async (ctx, o) => {
          const spec = (await ctx.project.findSpecs(ctx.currentProject ?? '', 'component', ['**/*.cy.jsx'], [], []))
          .find((spec) => spec.relative === o.path)

          expect(spec).to.exist
        }, { path: getPathForPlatform('src/stories/Button.stories.cy.jsx') })
      })
    })
  })
})
