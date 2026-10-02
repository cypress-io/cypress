import type { Specs_InlineSpecListFragment } from '../generated/graphql-test'
import { Specs_InlineSpecListFragmentDoc, SpecFilter_SetPreferencesDocument, TreeExpansionCache_SetPreferencesDocument, RunAllSpecsDocument } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'
import { getSeparator } from './tree/useCollapsibleTree'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  const mountInlineSpecList = ({ specFilter, experimentalRunAllSpecs, specsListTreeExpansion }: {specFilter?: string, experimentalRunAllSpecs?: boolean, specsListTreeExpansion?: Record<string, boolean>} = {}) => cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
    onResult: (ctx) => {
      if (!ctx.currentProject?.specs) {
        return ctx
      }

      specs = ctx.currentProject.specs = specs.map((spec) => ({ __typename: 'Spec', ...spec, id: spec.relative }))
      if (specFilter) {
        ctx.currentProject.savedState = { ...ctx.currentProject.savedState, specFilter }
      }

      if (specsListTreeExpansion) {
        ctx.currentProject.savedState = { ...ctx.currentProject.savedState, specsListTreeExpansion }
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

  describe('with a saved tree expansion state', () => {
    beforeEach(() => {
      cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)
    })

    it('starts with directories collapsed per the saved tree expansion state', () => {
      // getSeparator() reads window.__CYPRESS_CONFIG__, which the support file only sets in a
      // beforeEach — calling it at describe-body scope runs before that hook and throws.
      const componentsKey = ['src', 'components'].join(getSeparator())

      mountInlineSpecList({ specsListTreeExpansion: { [componentsKey]: false } })

      cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')
      cy.contains('button', 'src').should('have.attr', 'aria-expanded', 'true')
    })

    it('calls gql mutation to save updated tree expansion state', () => {
      const componentsKey = ['src', 'components'].join(getSeparator())

      mountInlineSpecList()

      const setTreeExpansionStub = cy.stub()

      cy.stubMutationResolver(TreeExpansionCache_SetPreferencesDocument, (defineResult, variables) => {
        setTreeExpansionStub(JSON.parse(variables.value)?.specsListTreeExpansion)
      })

      cy.contains('button', 'components').click()
      cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')

      cy.wrap(setTreeExpansionStub).should('have.been.calledWith', { [componentsKey]: false })
    })

    it('drops directories the project no longer has from the saved tree expansion state', () => {
      const componentsKey = ['src', 'components'].join(getSeparator())
      const removedKey = ['src', 'removed'].join(getSeparator())

      mountInlineSpecList({ specsListTreeExpansion: { [removedKey]: false } })

      const setTreeExpansionStub = cy.stub()

      cy.stubMutationResolver(TreeExpansionCache_SetPreferencesDocument, (defineResult, variables) => {
        setTreeExpansionStub(JSON.parse(variables.value)?.specsListTreeExpansion)
      })

      cy.contains('button', 'components').click()

      // without this the saved state would keep an entry for every directory ever collapsed,
      // and a directory that is deleted and later recreated would come back collapsed
      cy.wrap(setTreeExpansionStub).should('have.been.calledWith', { [componentsKey]: false })
    })

    it('does not overwrite the saved tree expansion state while filtering', () => {
      const componentsKey = ['src', 'components'].join(getSeparator())

      mountInlineSpecList({ specsListTreeExpansion: { [componentsKey]: false } })

      const setTreeExpansionStub = cy.stub()

      cy.stubMutationResolver(TreeExpansionCache_SetPreferencesDocument, (defineResult, variables) => {
        setTreeExpansionStub(JSON.parse(variables.value)?.specsListTreeExpansion)
      })

      // a filtered tree ignores the saved state so that every match stays visible
      cy.get('input').type('Spec')
      cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'true')
      cy.wrap(setTreeExpansionStub).should('not.have.been.called')

      // and clearing the filter brings the saved state back rather than a wiped one
      cy.get('input').clear()
      cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')
      cy.wrap(setTreeExpansionStub).should('not.have.been.called')
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
