import { Specs_InlineSpecListFragment, Specs_InlineSpecListFragmentDoc, SpecFilter_SetPreferencesDocument, RunAllSpecsDocument } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  const mountInlineSpecList = ({ specFilter, experimentalRunAllSpecs }: {specFilter?: string, experimentalRunAllSpecs?: boolean} = {}) => cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
    onResult: (ctx) => {
      if (!ctx.currentProject?.specs) {
        return ctx
      }

      specs = ctx.currentProject.specs = specs.map((spec) => ({ __typename: 'Spec', ...spec, id: spec.relative }))
      if (specFilter) {
        ctx.currentProject.savedState = { specFilter }
      }

      if (experimentalRunAllSpecs) {
        ctx.currentProject.config = [{ field: 'experimentalRunAllSpecs', value: true }]
      }

      return ctx
    },
    render: (gqlValue) => {
      return (
        <div class="bg-gray-1000">
          <InlineSpecList gql={gqlValue}></InlineSpecList>
        </div>
      )
    },
  })

  describe('with no saved search term', () => {
    beforeEach(() => {
      cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)
    })

    it('should render a list of specs', () => {
      mountInlineSpecList()
      cy.get('li')
      .should('exist')
      .and('have.length', 7)

      // overflow is required for the virtual list to work
      // this test will fail if the overflow set by `useVirtualList`
      // is overridden
      cy.get('[data-cy="specs-list-container"]')
      .should('have.css', 'overflow-y', 'auto')

      cy.percySnapshot()
    })

    it('should support fuzzy sort', () => {
      mountInlineSpecList()
      cy.get('input').type('compspec')

      cy.get('li').should('have.length', 4)
      .should('contain', 'src/components')
      .and('contain', 'Spec-A.spec.tsx')

      // Don't want the search to be too fuzzy
      // sr => src, co => components, se => spec
      cy.get('input').clear().type('srcose')
      cy.get('li').should('have.length', 0)
    })

    it('should open CreateSpec modal', () => {
      mountInlineSpecList()
      const newSpecSelector = `[aria-label="New spec"]`

      cy.get(newSpecSelector).click()
      cy.contains(defaultMessages.createSpec.newSpecModalTitle).should('be.visible')

      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.header).should('be.visible')
      cy.contains(defaultMessages.createSpec.e2e.importFromScaffold.description).should('be.visible')

      cy.contains(defaultMessages.createSpec.e2e.importTemplateSpec.header).should('be.visible')
      cy.contains(defaultMessages.createSpec.e2e.importTemplateSpec.description).should('be.visible')
    })

    it('should handle spec refresh', () => {
      const scrollVirtualList = (lastItem: string) => {
        cy.findAllByTestId('spec-row-item').last().dblclick().then(($el) => {
          if (!$el.text().includes(lastItem)) {
            scrollVirtualList(lastItem)
          }
        })
      }

      let _gqlValue: Specs_InlineSpecListFragment

      cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
        onResult (ctx) {
          if (ctx.currentProject?.specs) {
            ctx.currentProject.specs = ctx.currentProject.specs.slice(0, 50)
          }

          return ctx
        },
        render (gqlValue) {
          _gqlValue = gqlValue

          return (
            <div class="bg-gray-1000">
              <InlineSpecList gql={gqlValue}></InlineSpecList>
            </div>
          )
        },
      }).then(() => {
        const sortedSpecs = _gqlValue?.currentProject?.specs.sort((a, b) => a.relative < b.relative ? -1 : 1) || []
        const firstSpec = sortedSpecs[0]
        const lastSpec = sortedSpecs[sortedSpecs.length - 1]

        cy.contains(firstSpec.fileName).should('be.visible')
        scrollVirtualList(lastSpec.fileName)
        cy.contains(lastSpec.fileName).should('be.visible')
        cy.then(() => {
        // Emulating a gql update that shouldn't cause a scroll snap
          if (_gqlValue.currentProject?.specs) {
            _gqlValue.currentProject.specs = [..._gqlValue.currentProject.specs]
          }
        })

        cy.contains(lastSpec.fileName).should('be.visible')

        const newSpec = { ...lastSpec, relative: 'zzz/my-test.spec.tsx', fileName: 'my-test' }

        cy.then(() => {
        // Checking that specs list refreshes when spec is added
          if (_gqlValue.currentProject?.specs) {
            _gqlValue.currentProject.specs = _gqlValue.currentProject.specs.concat(newSpec)
          }
        })

        cy.contains(firstSpec.fileName).should('be.visible')
        scrollVirtualList(newSpec.fileName)
        cy.contains(newSpec.fileName).should('be.visible')

        cy.then(() => {
        // Checking that specs list refreshes when spec is deleted
          if (_gqlValue.currentProject?.specs) {
            _gqlValue.currentProject.specs = _gqlValue.currentProject.specs.filter(((spec) => spec.relative !== newSpec.relative))
          }
        })

        cy.contains(firstSpec.fileName).should('be.visible')
        scrollVirtualList(lastSpec.fileName)
        cy.contains(newSpec.fileName).should('not.exist')
      })
    })
  })

  describe('with a saved spec filter', () => {
    beforeEach(() => {
      cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)

      mountInlineSpecList({ specFilter: 'saved-search-term 🗑' })
      cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
      .as('searchField')

      cy.findByLabelText(defaultMessages.specPage.clearSearch, { selector: 'button' })
      .as('searchFieldClearButton')
    })

    it('starts with the saved filter', () => {
      cy.get('@searchField').should('have.value', 'saved-search-term 🗑')
      cy.get('li').should('not.exist')

      cy.get('@searchFieldClearButton').click()

      cy.get('li').should('have.length.greaterThan', 0)
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
    })
  })

  describe('Run all Specs', () => {
    const hoverRunAllSpecs = (directory: string, specNumber: number) => {
      let command = cy.contains('[data-cy=directory-item]', directory)

      return command.realHover().then(() => {
        cy.get('[data-cy=play-button]').should('exist')
        cy.get(`[data-cy="run-all-specs-for-${directory}"]`).realHover().then(() => {
          cy.get('[data-cy=tooltip-content]').should('contain.text', `Run ${specNumber} spec`)
        })
      })
    }

    beforeEach(() => {
      cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)
    })

    it('does not show feature unless experimentalRunAllSpecs is enabled', () => {
      mountInlineSpecList({ experimentalRunAllSpecs: false })

      cy.findByTestId('run-all-specs-for-all').should('not.exist')
      cy.contains('[data-cy=directory-item]', 'src').realHover()
      cy.findByTestId('run-all-specs-for-src').should('not.exist')
    })

    it('displays runAllSpecs when hovering over a spec-list directory row', () => {
      mountInlineSpecList({ experimentalRunAllSpecs: true })
      hoverRunAllSpecs('src', 4)
    })

    it('checks if functionality works after a search', () => {
      mountInlineSpecList({ experimentalRunAllSpecs: true, specFilter: 'B' })
      hoverRunAllSpecs('src/components', 1)
    })

    it('allows keyboard interactions to run spec groups without toggling sections', () => {
      // this test is specifically to catch regressions of a bug caused by nesting controls: https://github.com/cypress-io/cypress/issues/24762
      // TODO: #24966 remove this test when the structure of controls in this area has been flattened out
      mountInlineSpecList({ experimentalRunAllSpecs: true })

      const mutationStub = cy.stub().as('mutationStub')

      cy.stubMutationResolver(RunAllSpecsDocument, () => {
        mutationStub()
      })

      cy.findAllByTestId('spec-file-item').should('have.length', 4)
      cy.findAllByTestId('run-all-specs-button').eq(0)
      .click()
      .type(' ')

      // make sure typing didn't change displayed items
      cy.findAllByTestId('spec-file-item').should('have.length', 4)
      cy.findAllByTestId('run-all-specs-button').eq(1)
      .focus()
      .type('{enter}')

      // make sure typing didn't change displayed items
      cy.findAllByTestId('spec-file-item').should('have.length', 4)
      cy.get('@mutationStub').should('have.been.calledThrice')
    })
  })
})
