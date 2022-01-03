import { Specs_InlineSpecListFragment, Specs_InlineSpecListFragmentDoc } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'
import { defaultMessages } from '@cy/i18n'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  beforeEach(() => {
    cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)
  })

  const mountInlineSpecList = () => cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
    onResult: (ctx) => {
      if (!ctx.currentProject?.specs) {
        return ctx
      }

      ctx.currentProject.specs.edges = specs.map((spec) => ({ __typename: 'SpecEdge', node: { __typename: 'Spec', ...spec, id: spec.relative } }))
      specs = ctx.currentProject?.specs?.edges || []

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

  it('should render a list of specs', () => {
    mountInlineSpecList()
    cy.get('li')
    .should('exist')
    .and('have.length', 7)
  })

  it('should support fuzzy sort', () => {
    mountInlineSpecList()
    cy.get('input').type('scome', { force: true })

    cy.get('li').should('have.length', 4)
    .should('contain', 'src/components')
    .and('contain', 'Spec-A.spec.tsx')
  })

  it('should open CreateSpec modal', () => {
    mountInlineSpecList()
    const newSpecSelector = `[aria-label="New Spec"]`

    cy.get(newSpecSelector).click()
    cy.contains(defaultMessages.createSpec.newSpecModalTitle).should('be.visible')
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
        if (ctx.currentProject?.specs?.edges) {
          ctx.currentProject.specs.edges = ctx.currentProject.specs.edges.slice(0, 50)
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
      const sortedSpecs = _gqlValue?.currentProject?.specs?.edges.sort((a, b) => a.node.relative < b.node.relative ? -1 : 1) || []
      const firstSpec = sortedSpecs[0]
      const lastSpec = sortedSpecs[sortedSpecs.length - 1]

      cy.contains(firstSpec.node.fileName).should('be.visible')
      scrollVirtualList(lastSpec.node.fileName)
      cy.contains(lastSpec.node.fileName).should('be.visible')
      cy.then(() => {
        // Emulating a gql update that shouldn't cause a scroll snap
        if (_gqlValue.currentProject?.specs?.edges) {
          _gqlValue.currentProject.specs.edges = [..._gqlValue.currentProject.specs.edges]
        }
      })

      cy.contains(lastSpec.node.fileName).should('be.visible')

      const newSpec = { node: { ...lastSpec.node, relative: 'zzz/my-test.spec.tsx', fileName: 'my-test' } }

      cy.then(() => {
        // Checking that specs list refreshes when spec is added
        if (_gqlValue.currentProject?.specs?.edges) {
          _gqlValue.currentProject.specs.edges = _gqlValue.currentProject.specs.edges.concat(newSpec)
        }
      })

      cy.contains(firstSpec.node.fileName).should('be.visible')
      scrollVirtualList(newSpec.node.fileName)
      cy.contains(newSpec.node.fileName).should('be.visible')

      cy.then(() => {
        // Checking that specs list refreshes when spec is deleted
        if (_gqlValue.currentProject?.specs?.edges) {
          _gqlValue.currentProject.specs.edges = _gqlValue.currentProject.specs.edges.filter(((spec) => spec.node.relative !== newSpec.node.relative))
        }
      })

      cy.contains(firstSpec.node.fileName).should('be.visible')
      scrollVirtualList(lastSpec.node.fileName)
      cy.contains(newSpec.node.fileName).should('not.exist')
    })
  })
})
