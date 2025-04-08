import SpecsList from './SpecsList.vue'
import { Specs_SpecsListFragmentDoc, SpecsListFragment, TestingTypeEnum, SpecFilter_SetPreferencesDocument } from '../generated/graphql-test'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<SpecsList />', { keystrokeDelay: 0 }, () => {
  let specs: Array<SpecsListFragment>

  function mountWithTestingType ({ testingType, specFilter, experimentalRunAllSpecs }: { testingType?: TestingTypeEnum, specFilter?: string, experimentalRunAllSpecs?: boolean } = {}) {
    specs = []
    const showCreateSpecModalSpy = cy.spy().as('showCreateSpecModalSpy')

    return cy.mountFragment(Specs_SpecsListFragmentDoc, {
      variableTypes: {
        hasRunIds: 'Boolean',
      },
      variables: {
        hasRunIds: false,
      },
      onResult: (ctx) => {
        if (!ctx.currentProject) throw new Error('need current project')

        specs = ctx.currentProject?.specs || []
        if (testingType) {
          ctx.currentProject.currentTestingType = testingType
        }

        if (specFilter) {
          ctx.currentProject.savedState = { specFilter }
        }

        if (experimentalRunAllSpecs) {
          ctx.currentProject.config = [{ field: 'experimentalRunAllSpecs', value: true }]
        }

        return ctx
      },
      render: (gqlVal) => {
        return (
          <div class="h-[850px]">
            <SpecsList gql={gqlVal} onShowCreateSpecModal={showCreateSpecModalSpy} mostRecentUpdate={null} />
          </div>
        )
      },
    })
  }

  context('when testingType is unset', () => {
    describe('with no saved filter', () => {
      beforeEach(() => {
        mountWithTestingType({})
      })

      it('should filter specs', () => {
      // make sure things have rendered for snapshot
      // and that only a subset of the specs are displayed
      // (this means the virtualized list is working)

        cy.get('[data-cy="spec-list-file"]')
        .should('have.length.above', 2)
        .should('have.length.below', specs.length)

        cy.percySnapshot('full list')
        const longestSpec = specs.reduce((acc, spec) =>
          acc.relative.length < spec.relative.length ? spec : acc
        , specs[0])

        cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
        .as('specsListInput')

        cy.get('@specsListInput').type('garbage 🗑', { delay: 0 })
        .get('[data-cy-spec-list-file]')
        .should('not.exist')
        .get('[data-cy-spec-list-directory]')
        .should('not.exist')

        cy.contains(`${defaultMessages.specPage.noResultsMessage} garbage 🗑`)
        .should('be.visible')

        cy.percySnapshot('no results')

        cy.get('[data-cy="no-results-clear"]').click()
        cy.get('@specsListInput').invoke('val').should('be.empty')

        // validate that something re-populated in the specs list
        cy.get('[data-cy="spec-list-file"]').should('have.length.above', 2)

        cy.get('@specsListInput').type(longestSpec.fileName)
        cy.get('[data-cy="spec-list-directory"]').first()
        .should('contain', longestSpec.relative.replace(`/${longestSpec.baseName}`, ''))

        cy.get('[data-cy="spec-list-file"]').last().within(() => {
          cy.contains('a', longestSpec.baseName)
          .should('be.visible')
          .and('have.attr', 'href', `#/specs/runner?file=${longestSpec.relative}`)
        })

        const directory = longestSpec.relative.slice(0, longestSpec.relative.lastIndexOf('/'))

        cy.get('@specsListInput').clear().type(directory)
        cy.get('[data-cy="spec-list-directory"]').first().should('contain', directory)
        cy.percySnapshot('matching directory search')

        // Support full relative path search
        cy.get('@specsListInput').clear().type(longestSpec.relative)
        cy.get('[data-cy="spec-list-directory"]').first().should('contain', directory)
        cy.get('[data-cy="spec-list-file"]').should('contain', longestSpec.baseName)

        // test interactions

        const directories: string[] = Array.from(new Set(specs.map((spec) => spec.relative.split('/')[0]))).sort()

        cy.get('@specsListInput').clear()

        directories.forEach((dir) => {
          cy.contains('button[data-cy="row-directory-depth-0"]', new RegExp(`^${dir}`))
          .should('have.attr', 'aria-expanded', 'true')
          .click()
          .should('have.attr', 'aria-expanded', 'false')
        })

        cy.get('[data-cy="spec-item"]').should('not.exist')

        cy.contains('button[data-cy="row-directory-depth-0"]', directories[0])
        .should('have.attr', 'aria-expanded', 'false')
        .focus()
        .type('{enter}')

        cy.contains('button[data-cy="row-directory-depth-0"]', directories[0])
        .should('have.attr', 'aria-expanded', 'true')
        .focus()
        .realPress('Space')

        cy.contains('button[data-cy="row-directory-depth-0"]', directories[0])
        .should('have.attr', 'aria-expanded', 'false')

        cy.get('[data-cy="spec-item"]').should('not.exist')

        cy.contains(defaultMessages.createSpec.newSpec).click()
        cy.get('@showCreateSpecModalSpy').should('have.been.calledOnce')
      })

      describe('responsive behavior', () => {
      // Spec name (first) column is handled by type-specific tests below

        it('should display last updated column', () => {
          cy.findByTestId('last-updated-header').as('header')
          cy.get('@header').should('be.visible').and('contain', 'Last updated')
        })

        context('when screen is wide', { viewportWidth: 1200 }, () => {
          it('should display latest runs column with full text', () => {
            cy.findByTestId('latest-runs-header').within(() => {
              cy.findByTestId('short-header-text').should('not.be.visible')
              cy.findByTestId('full-header-text').should('be.visible')
              .and('have.text', 'Latest runs')
            })
          })

          it('should display average duration column with full text', () => {
            cy.findByTestId('average-duration-header').within(() => {
              cy.findByTestId('short-header-text').should('not.be.visible')
              cy.findByTestId('full-header-text').should('be.visible')
              .and('have.text', 'Average duration')
            })
          })
        })

        context('when screen is narrow', { viewportWidth: 800 }, () => {
          it('should display latest runs column with short text', () => {
            cy.findByTestId('latest-runs-header').within(() => {
              cy.findByTestId('full-header-text').should('not.be.visible')
              cy.findByTestId('short-header-text').should('be.visible')
              .and('have.text', 'Runs')
            })
          })

          it('should display average duration column with full text', () => {
            cy.findByTestId('average-duration-header').within(() => {
              cy.findByTestId('full-header-text').should('not.be.visible')
              cy.findByTestId('short-header-text').should('be.visible')
              .and('have.text', 'Duration')
            })
          })
        })
      })
    })

    describe('with a saved spec filter', () => {
      beforeEach(() => {
        mountWithTestingType({ specFilter: 'saved-search-term 🗑' })
        cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
        .as('searchField')

        cy.findByLabelText(defaultMessages.specPage.clearSearch, { selector: 'button' })
        .as('searchFieldClearButton')
      })

      it('starts with the saved filter', () => {
        cy.get('@searchField').should('have.value', 'saved-search-term 🗑')

        cy.get('@searchFieldClearButton').should('be.visible')

        // this shouldn't match any results, so let's confirm none are shown

        cy.contains('button', defaultMessages.createSpec.viewSpecPatternButton)
        .as('resultsCount')
        .should('contain.text', '0 of 50 matches')

        // confirm results clear correctly
        cy.contains('button', defaultMessages.noResults.clearSearch).click()

        cy.get('@resultsCount')
        .should('contain.text', '50 matches')
        // the exact wording here can be deceptive so confirm it's not still
        // displaying "of", since X of 50 Matches would pass for containing "50 matches"
        // but would be wrong.
        .should('not.contain.text', 'of 50 matches')
      })

      it('calls gql mutation to save updated filter', () => {
        const setSpecFilterStub = cy.stub()

        cy.stubMutationResolver(SpecFilter_SetPreferencesDocument, (defineResult, variables) => {
          const specFilter = JSON.parse(variables.value)?.specFilter

          setSpecFilterStub(specFilter)
        })

        // since there is a saved search, clear it out
        cy.get('@searchFieldClearButton').click()
        cy.get('@searchField').type('test')

        cy.wrap(setSpecFilterStub).should('have.been.calledWith', 'test')
        cy.get('@searchField').type('{backspace}{backspace}')
        cy.wrap(setSpecFilterStub).should('have.been.calledWith', 'te')
        cy.get('@searchField').type('{backspace}{backspace}')
        cy.wrap(setSpecFilterStub).should('have.been.calledWith', '')
        cy.wait(100) // there's an intentional 50ms delay in the code, lets just wait it out

        // Specs List has a min width of ~650px in the app, so there's no need to snapshot below that
        cy.viewport(650, 850)
        cy.percySnapshot('narrow')
        cy.viewport(800, 850)
        cy.percySnapshot('medium')
        cy.viewport(1200, 850)
        cy.percySnapshot('wide')
        cy.viewport(2000, 850)
        cy.percySnapshot('widest')
      })
    })
  })

  context('when testingType is e2e', () => {
    beforeEach(() => {
      mountWithTestingType({ testingType: 'e2e' })
    })

    it('should display the e2e testing header', () => {
      cy.findByTestId('specs-testing-type-header').within(() => {
        cy.get('button[aria-selected="true"]').should('contain.text', 'E2E')
      })
    })
  })

  context('when testingType is component', () => {
    beforeEach(() => {
      mountWithTestingType({ testingType: 'component' })
    })

    it('should display the component testing header', () => {
      cy.findByTestId('specs-testing-type-header').within(() => {
        cy.get('button[aria-selected="true"]').should('contain.text', 'Component')
      })
    })
  })

  describe('Run all Specs', () => {
    const hoverRunAllSpecs = (directory: string, specNumber: number) => {
      cy.contains('[data-cy=spec-item-directory]', directory).realHover().then(() => {
        cy.get(`[data-cy="run-all-specs-for-${directory}"]`).should('contain.text', `Run ${specNumber} spec${specNumber > 1 ? 's' : ''}`)
        cy.get('[data-cy="play-button"]').should('exist')
      })
    }

    it('does not show feature unless experimentalRunAllSpecs is enabled', () => {
      mountWithTestingType({ experimentalRunAllSpecs: false })

      cy.contains('button', 'Run all specs').should('not.exist')
      cy.contains('[data-cy=spec-item-directory]', '__test__').realHover()
      cy.contains('button', 'Run 5 specs').should('not.exist')
    })

    it('displays runAllSpecs when hovering over a spec-list directory row', () => {
      mountWithTestingType({ experimentalRunAllSpecs: true })
      hoverRunAllSpecs('__test__', 5)
      hoverRunAllSpecs('frontend', 11)
      hoverRunAllSpecs('components', 6)

      cy.percySnapshot()
    })

    it('checks if functionality works after a search', () => {
      mountWithTestingType({ experimentalRunAllSpecs: true, specFilter: 'base' })
      hoverRunAllSpecs('__test__', 2)
      hoverRunAllSpecs('frontend/components', 2)
      hoverRunAllSpecs('Cell/test', 1)
    })

    it('can tab into run-all', () => {
      mountWithTestingType({ experimentalRunAllSpecs: true })
      cy.get('[data-cy=run-all-specs-for-__test__]').should('not.be.visible')

      cy.tabUntil(($el) => {
        return $el.text().includes('Run 5 specs')
      })

      cy.get('[data-cy=run-all-specs-for-__test__]').should('be.visible')
    })
  })
})
