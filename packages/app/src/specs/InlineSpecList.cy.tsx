import { Specs_InlineSpecListFragment, Specs_InlineSpecListFragmentDoc, SpecFilter_SetPreferencesDocument } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'
import { defaultMessages } from '@cy/i18n'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  const mountInlineSpecList = (specFilter?: string) => cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
    onResult: (ctx) => {
      if (!ctx.currentProject?.specs) {
        return ctx
      }

      specs = ctx.currentProject.specs = specs.map((spec) => ({ __typename: 'Spec', ...spec, id: spec.relative }))
      if (specFilter) {
        ctx.currentProject.savedState = { specFilter }
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

      cy.percySnapshot()
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

      mountInlineSpecList('saved-search-term 🗑')
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
})
