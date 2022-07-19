import SpecsList from './SpecsList.vue'
import { Specs_SpecsListFragmentDoc, SpecsListFragment, TestingTypeEnum } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'

describe('<SpecsList />', { keystrokeDelay: 0 }, () => {
  let specs: Array<SpecsListFragment>

  function mountWithTestingType (testingType: TestingTypeEnum | undefined) {
    specs = []
    const showCreateSpecModalSpy = cy.spy().as('showCreateSpecModalSpy')

    cy.mountFragment(Specs_SpecsListFragmentDoc, {
      variableTypes: {
        hasBranch: 'Boolean',
      },
      variables: {
        hasBranch: true,
      },
      onResult: (ctx) => {
        if (!ctx.currentProject) throw new Error('need current project')

        specs = ctx.currentProject?.specs || []
        if (testingType) {
          ctx.currentProject.currentTestingType = testingType
        }

        return ctx
      },
      render: (gqlVal) => {
        return <SpecsList gql={gqlVal} onShowCreateSpecModal={showCreateSpecModalSpy} />
      },
    })
  }

  context('when testingType is unset', () => {
    beforeEach(() => {
      mountWithTestingType(undefined)
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
      .should('contain', longestSpec.relative.replace(`/${longestSpec.fileName}${longestSpec.specFileExtension}`, ''))

      cy.get('[data-cy="spec-list-file"]').last().within(() => {
        cy.contains('a', longestSpec.baseName)
        .should('be.visible')
        .and('have.attr', 'href', `#/specs/runner?file=${longestSpec.relative}`)
      })

      const directory = longestSpec.relative.slice(0, longestSpec.relative.lastIndexOf('/'))

      cy.get('@specsListInput').clear().type(directory)
      cy.get('[data-cy="spec-list-directory"]').first().should('contain', directory)
      cy.percySnapshot('matching directory search')

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

      it('displays the list as expected visually at various widths', () => {
        cy.get('[data-cy="spec-list-file"]')
        .should('have.length.above', 2)
        .should('have.length.below', specs.length)

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
      mountWithTestingType('e2e')
    })

    it('should display the e2e testing header', () => {
      cy.findByTestId('specs-testing-type-header').should('have.text', 'E2E specs')
    })
  })

  context('when testingType is component', () => {
    beforeEach(() => {
      mountWithTestingType('component')
    })

    it('should display the component testing header', () => {
      cy.findByTestId('specs-testing-type-header').should('have.text', 'Component specs')
    })
  })
})
