import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { SinonStub } from 'sinon'
import { getPathForPlatform } from '../../src/paths'

describe('App: Specs', () => {
  describe('Testing Type: E2E', () => {
    context('js project with default spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs')
        cy.startAppServer('e2e')
        cy.visitApp()

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
          cy.get('[data-cy="file-match-indicator"]').contains('No Matches')
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
        ]

        const expectedScaffoldPathsForPlatform = expectedScaffoldPaths.map(getPathForPlatform)

        it('scaffolds example files when card is clicked', { viewportHeight: 1200 }, () => {
          cy.get('@ScaffoldCard').click()

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.e2e.importFromScaffold.specsAddedHeader,
          }).within(() => {
            cy.findByRole('button', { name: 'Close' }).should('be.visible').as('CloseDialogButton')
          })

          cy.withCtx(async (ctx, options) => {
            const generatedSpecPaths = (await ctx.project.findSpecs({
              projectRoot: ctx.currentProject ?? '',
              testingType: 'e2e',
              specPattern: ['**/*.cy.js'],
              configSpecPattern: ['**/*.cy.js'],
              excludeSpecPattern: [],
              additionalIgnorePattern: [],
            })).map((spec) => spec.relative)

            // Validate that all expected paths have been generated within the data context
            expect(generatedSpecPaths.filter((path) => {
              return options.expectedScaffoldPathsForPlatform.includes(path)
            })).to.have.lengthOf(options.expectedScaffoldPathsForPlatform.length)
          }, { expectedScaffoldPathsForPlatform })

          cy.percySnapshot()

          // Dismisses dialog with close button press
          cy.get('@CloseDialogButton').click()
          cy.findByRole('dialog').should('not.exist')

          expectedScaffoldPaths.forEach((spec) => {
            // Validate that links for each generated spec are rendered
            cy.get(`a[href="#/specs/runner?file=${spec}"`).scrollIntoView().should('exist')
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

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('cypress/e2e/spec.cy.ts'))
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

          cy.get('pre').should('contain', 'describe(\'empty spec\'')

          cy.percySnapshot('Generator success')

          cy.get('[aria-label="Close"]').click()

          cy.visitApp().get('[data-cy="spec-list-file"]').contains('MyTest.cy.js')
        })
      })
    })

    context('ts project with default spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs')

        cy.withCtx(async (ctx) => {
          await ctx.actions.file.writeFileInProject('tsconfig.json', '{}')
        })

        cy.openProject('no-specs')

        cy.startAppServer('e2e')
        cy.visitApp()

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

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('cypress/e2e/spec.cy.ts'))
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

          cy.get('pre').should('contain', 'describe(\'empty spec\'')

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

        cy.findByTestId('file-match-indicator').should('contain', 'No Matches')
        cy.findByRole('button', { name: 'cypress.config.js' })
        cy.findByTestId('spec-pattern').should('contain', 'src/**/*.{cy,spec}.{js,jsx}')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern)
        cy.findByRole('button', { name: 'New Spec', exact: false })
      })

      it('opens config file in ide from SpecPattern', () => {
        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx.actions.file, 'openFile')
        })

        cy.findByRole('button', { name: 'cypress.config.js' }).click()

        cy.withCtx((ctx, o) => {
          expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`cypress\.config\.js$`)), 1, 1)
        })
      })

      it('opens config file in ide from specPattern text description', () => {
        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx.actions.file, 'openFile')
        })

        cy.get('[data-cy="no-specs-specPattern"]').click()

        cy.withCtx((ctx, o) => {
          expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`cypress\.config\.js$`)), 1, 1)
        })
      })

      it('opens config file in ide from footer button', () => {
        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx.actions.file, 'openFile')
        })

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern).click()

        cy.withCtx((ctx, o) => {
          expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`cypress\.config\.js$`)), 1, 1)
        })
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

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('src/spec.cy.js'))
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

          cy.get('pre').should('contain', 'describe(\'empty spec\'')

          cy.percySnapshot('Generator success')

          cy.get('[aria-label="Close"]').click()

          cy.visitApp().get('[data-cy-row]').contains('MyTest.cy.js')
        })

        it('generates spec with file name that does not contain a known spec extension', () => {
          cy.withCtx(async (ctx) => {
            let config = await ctx.actions.file.readFileInProject('cypress.config.js')

            config = config.replace(
                `specPattern: 'src/**/*.{cy,spec}.{js,jsx}'`,
                `specPattern: 'src/e2e/**/*.{js,jsx}'`,
            )

            await ctx.actions.file.writeFileInProject('cypress.config.js', config)
          })

          // Timeout is increased here to allow ample time for the config change to be processed
          cy.contains('No Specs Found', { timeout: 10000 }).should('be.visible')

          cy.findByRole('button', { name: 'New Spec' }).click()
          cy.contains('Create new empty spec').click()

          cy.findAllByLabelText(defaultMessages.createSpec.e2e.importEmptySpec.inputPlaceholder)
          .as('enterSpecInput')

          cy.get('@enterSpecInput').invoke('val').should('eq', getPathForPlatform('src/e2e/spec.js'))
          cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.invalidSpecWarning).should('not.exist')

          cy.contains('button', defaultMessages.createSpec.createSpec).should('not.be.disabled').click()
          cy.contains('h2', defaultMessages.createSpec.successPage.header)

          cy.get('[data-cy="file-row"]').contains(getPathForPlatform('src/e2e/spec.js')).should('be.visible')
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

        cy.get('@enterSpecInput').clear().type(getPathForPlatform('src/e2e/MyTest.spec.jsx'))

        cy.contains(defaultMessages.createSpec.e2e.importEmptySpec.specExtensionWarning)
        cy.percySnapshot('Non-recommended spec pattern warning')
        cy.contains('span', '{filename}.cy.jsx')
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
            const stats = await ctx.file.checkIfFileExists(o.path)

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
    context('project with default spec pattern', () => {
      beforeEach(() => {
        cy.scaffoldProject('no-specs')
        cy.openProject('no-specs')
        cy.startAppServer('component')
        cy.visitApp()

        cy.findAllByTestId('card').eq(0).as('EmptyCard')
      })

      it('shows create new empty spec card', () => {
        cy.get('@EmptyCard')
        .within(() => {
          cy.findByRole('button', {
            name: 'Create new empty spec',
          }).should('be.visible')
          .and('not.be.disabled')
        })
      })

      context('create empty card', () => {
        beforeEach(() => {
          cy.get('@EmptyCard').click()

          cy.findByRole('dialog', {
            name: 'Enter the path for your new spec',
          }).as('CreateEmptySpecDialog')

          cy.findByRole('button', { name: 'Close' }).as('DialogCloseButton')
        })

        it('shows dialog that can be dismissed with Close (x) button press', () => {
          cy.get('@DialogCloseButton').click()
          cy.findByRole('dialog', {
            name: 'Enter the path for your new spec',
          }).should('not.exist')
        })

        it('shows success modal when empty spec is created', () => {
          cy.get('@CreateEmptySpecDialog').within(() => {
            cy.findByLabelText('Enter a relative path...').invoke('val').should('eq', getPathForPlatform('cypress/component/ComponentName.cy.ts'))

            cy.findByLabelText('Enter a relative path...').clear().type('cypress/my-empty-spec.cy.js')

            cy.findByRole('button', { name: 'Create Spec' }).click()
          })

          cy.findByRole('dialog', {
            name: defaultMessages.createSpec.successPage.header,
          }).as('SuccessDialog').within(() => {
            cy.contains(getPathForPlatform('cypress/my-empty-spec.cy.js')).should('be.visible')
            cy.findByRole('button', { name: 'Close' }).should('be.visible')

            cy.findByRole('link', { name: 'Okay, run the spec' })
            .should('have.attr', 'href', `#/specs/runner?file=cypress/my-empty-spec.cy.js`)

            cy.findByRole('button', { name: 'Create another spec' }).click()
          })

          // 'Create a new spec' dialog presents with options when user indicates they want to create
          // another spec.
          cy.findByRole('dialog', { name: 'Enter the path for your new spec' }).should('be.visible')
        })

        it('navigates to spec runner when selected', () => {
          cy.get('@CreateEmptySpecDialog').within(() => {
            cy.findByLabelText('Enter a relative path...').invoke('val').should('eq', getPathForPlatform('cypress/component/ComponentName.cy.ts'))

            cy.findByLabelText('Enter a relative path...').clear().type('cypress/my-empty-spec.cy.js')

            cy.findByRole('button', { name: 'Create Spec' }).click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).within(() => {
            cy.findByRole('link', {
              name: 'Okay, run the spec',
            }).should('have.attr', 'href', '#/specs/runner?file=cypress/my-empty-spec.cy.js').click()
          })

          cy.get('#main-pane').should('be.visible')

          cy.location().its('href').should('contain', '#/specs/runner?file=cypress/my-empty-spec.cy.js')
        })

        it('displays alert with docs link on new spec', () => {
          cy.get('@CreateEmptySpecDialog').within(() => {
            cy.findByLabelText('Enter a relative path...').invoke('val').should('eq', getPathForPlatform('cypress/component/ComponentName.cy.ts'))

            cy.findByLabelText('Enter a relative path...').clear().type('cypress/my-empty-spec.cy.js')

            cy.findByRole('button', { name: 'Create Spec' }).click()
          })

          cy.findByRole('dialog', { name: defaultMessages.createSpec.successPage.header }).within(() => {
            cy.findByRole('link', {
              name: 'Okay, run the spec',
            }).should('have.attr', 'href', '#/specs/runner?file=cypress/my-empty-spec.cy.js').click()
          })

          cy.contains('Review the docs')
          .should('have.attr', 'href', 'https://on.cypress.io/mount')

          cy.log('should not contain the link if you navigate away and back')
          cy.get('body').type('f')
          cy.get('[data-cy=spec-file-item]').first().click()
          cy.get('#spec-runner-header').should('not.contain', 'Review the docs')

          cy.get('[data-cy=spec-file-item]').last().click()
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

        cy.findByTestId('file-match-indicator').should('contain', 'No Matches')
        cy.findByRole('button', { name: 'cypress.config.js' })
        cy.findByTestId('spec-pattern').should('contain', 'src/specs-folder/*.cy.{js,jsx}')

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern)
        cy.findByRole('button', { name: 'New Spec', exact: false })
      })

      it('opens config file in ide from SpecPattern', () => {
        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx.actions.file, 'openFile')
        })

        cy.findByRole('button', { name: 'cypress.config.js' }).click()

        cy.withCtx((ctx, o) => {
          expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`cypress\.config\.js$`)), 1, 1)
        })
      })

      it('opens config file in ide from footer button', () => {
        cy.withCtx((ctx, o) => {
          o.sinon.stub(ctx.actions.file, 'openFile')
        })

        cy.contains('button', defaultMessages.createSpec.updateSpecPattern).click()

        cy.withCtx((ctx, o) => {
          expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`cypress\.config\.js$`)), 1, 1)
        })
      })

      it('shows new spec button to start creation workflow', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.findByRole('dialog', { name: 'Enter the path for your new spec' }).should('be.visible')
      })

      it('shows create first spec page with create empty option and goes back if it is cancel', () => {
        cy.findByRole('button', { name: 'New Spec', exact: false }).click()

        cy.contains('Cancel').click()

        cy.findByRole('dialog', { name: 'Enter the path for your new spec' }).should('not.exist')
      })

      it('generates spec with file name that does not contain a known spec extension', () => {
        cy.withCtx(async (ctx) => {
          let config = await ctx.actions.file.readFileInProject('cypress.config.js')

          config = config.replace(
              `specPattern: 'src/specs-folder/*.cy.{js,jsx}'`,
              `specPattern: 'src/specs-folder/*.{js,jsx}'`,
          )

          await ctx.actions.file.writeFileInProject('cypress.config.js', config)
        })

        // Timeout is increased here to allow ample time for the config change to be processed
        cy.contains('No Specs Found', { timeout: 10000 }).should('be.visible')
        cy.findByRole('button', { name: 'New Spec' }).click()

        cy.findByRole('dialog', {
          name: 'Enter the path for your new spec',
        }).within(() => {
          cy.findByLabelText('Enter a relative path...').invoke('val').should('eq', getPathForPlatform('src/specs-folder/ComponentName.js'))

          cy.findByRole('button', { name: 'Create Spec' }).click()
        })

        cy.findByRole('dialog', {
          name: defaultMessages.createSpec.successPage.header,
        }).as('SuccessDialog').within(() => {
          cy.contains(getPathForPlatform('src/specs-folder/ComponentName.js')).should('be.visible')
        })
      })
    })
  })

  describe('Spec Watcher', () => {
    beforeEach(() => {
      cy.scaffoldProject('no-specs')
      cy.openProject('no-specs')
      cy.startAppServer('e2e')
      cy.visitApp()

      cy.findByRole('heading', {
        level: 1,
        name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
      }).should('be.visible')
    })

    it('updates spec list when files are added to/removed from areas matching specPattern', () => {
      cy.withCtx(async (ctx) => {
        // Directory is added to root so it does not match specPattern
        await ctx.actions.file.writeFileInProject('test-1.cy.js', 'it()')
      })

      // No Specs Found page renders, as the added dir does not match the specPattern
      cy.findByRole('heading', {
        level: 1,
        name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
      }).should('be.visible')

      cy.withCtx(async (ctx) => {
        // Directory contents are moved into cypress/e2e dir
        await ctx.actions.file.moveFileInProject('test-1.cy.js', 'cypress/e2e/test-1.cy.js')
      })

      // Specs list should now show, with the spec from the moved dir now matching the specPattern
      cy.contains('[data-cy="spec-item"]', 'test-1.cy.js')

      cy.withCtx(async (ctx) => {
        // Writing more specs to directory
        await ctx.actions.file.writeFileInProject('cypress/e2e/test-2.cy.js', 'it()')
        await ctx.actions.file.writeFileInProject('cypress/e2e/test-3.cy.js', 'it()')
      })

      // Specs list should show all added specs
      cy.contains('[data-cy="spec-item"]', 'test-1.cy.js')
      cy.contains('[data-cy="spec-item"]', 'test-2.cy.js')
      cy.contains('[data-cy="spec-item"]', 'test-3.cy.js')

      cy.withCtx(async (ctx) => {
        // Files are moved back to root, where they no will no longer match specPattern
        await ctx.actions.file.moveFileInProject('cypress/e2e/test-1.cy.js', 'test-1.cy.js')
        await ctx.actions.file.moveFileInProject('cypress/e2e/test-2.cy.js', 'test-2.cy.js')
        await ctx.actions.file.moveFileInProject('cypress/e2e/test-3.cy.js', 'test-3.cy.js')
      })

      // No Specs Found page now renders, as all previously matching specs were moved
      cy.findByRole('heading', {
        level: 1,
        name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
      }).should('be.visible')
    })

    it('updates spec list when directories are added to/removed from areas matching specPattern', () => {
      cy.withCtx(async (ctx) => {
        // Directory is added to root so it does not match specPattern
        await ctx.actions.file.writeFileInProject('testDir/test-1.cy.js', 'it()')
      })

      // No Specs Found page renders, as the added dir does not match the specPattern
      cy.findByRole('heading', {
        level: 1,
        name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
      }).should('be.visible')

      cy.withCtx(async (ctx) => {
        // Directory contents are moved into cypress/e2e dir
        await ctx.actions.file.moveFileInProject('testDir', 'cypress/e2e/testDir')
      })

      // Specs list should now show, with the spec from the moved dir now matching the specPattern
      cy.contains('[data-cy="spec-item"]', 'test-1.cy.js')

      cy.withCtx(async (ctx) => {
        // Writing more specs to directory
        await ctx.actions.file.writeFileInProject('cypress/e2e/testDir/test-2.cy.js', 'it()')
        await ctx.actions.file.writeFileInProject('cypress/e2e/testDir/test-3.cy.js', 'it()')
      })

      // Specs list should show all added specs
      cy.contains('[data-cy="spec-item"]', 'test-1.cy.js')
      cy.contains('[data-cy="spec-item"]', 'test-2.cy.js')
      cy.contains('[data-cy="spec-item"]', 'test-3.cy.js')

      cy.withCtx(async (ctx) => {
        // Directory is moved back to root, where it no will no longer match specPattern
        await ctx.actions.file.moveFileInProject('cypress/e2e/testDir', 'testDir')
      })

      // No Specs Found page now renders, as all previously matching specs were moved
      cy.findByRole('heading', {
        level: 1,
        name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
      }).should('be.visible')
    })

    it('debounces spec updates if many additions occur', () => {
      const specs = [...Array(20)].map((v, index) => {
        return `test-${index}.cy.js`
      })

      cy.withCtx(async (ctx, o) => {
        o.sinon.spy(ctx.actions.project, 'setSpecs')
        for (const spec of o.specs) {
          await ctx.actions.file.writeFileInProject(`cypress/e2e/${spec}`, 'it()')
        }
      }, { specs })

      cy.contains('20 Matches')

      cy.withRetryableCtx((ctx, o) => {
        // setSpecs is debounced, the number of calls should be less than the number of files removed
        // in such rapid succession.
        expect((ctx.actions.project.setSpecs as SinonStub).callCount).to.be.lessThan(20)
      })

      cy.withCtx(async (ctx, o) => {
        (ctx.actions.project.setSpecs as SinonStub).resetHistory()
        for (const spec of o.specs) {
          await ctx.actions.file.removeFileInProject(`cypress/e2e/${spec}`)
        }
      }, { specs })

      cy.findByRole('heading', {
        level: 1,
        name: defaultMessages.createSpec.page.defaultPatternNoSpecs.title,
      }).should('be.visible')

      cy.withRetryableCtx((ctx) => {
        // setSpecs is debounced, the number of calls should be less than the number of files removed
        // in such rapid succession.
        expect((ctx.actions.project.setSpecs as SinonStub).callCount).to.be.lessThan(20)
      })
    })
  })
})
