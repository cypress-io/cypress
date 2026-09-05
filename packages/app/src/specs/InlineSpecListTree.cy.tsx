import { reactive, ref } from 'vue'
import { useSpecStore } from '../store'
import InlineSpecListTree from './InlineSpecListTree.vue'
import { getSeparator } from './tree/useCollapsibleTree'
import type { FuzzyFoundSpec } from './tree/useCollapsibleTree'

describe('InlineSpecListTree', () => {
  let foundSpecs: FuzzyFoundSpec[]

  before(() => {
    cy.fixture('found-specs').then((specs) => foundSpecs = specs.map((spec) => ({ ...spec, indexes: [] })))
  })

  it('handles keyboard navigation', () => {
    const specProp = ref(foundSpecs.slice(0, 4))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    // should have 4 actual spec links
    cy.get('[data-cy=spec-row-item] a').should('have.length', 4)
    // should have 3 toggle buttons to hide and show directories
    cy.get('[data-cy=spec-row-item] button').should('have.length', 3)
    .and('have.attr', 'aria-expanded', 'true') // all should be open at the start

    cy.findAllByTestId('spec-row-item').should('have.length', 7)
    .first()
    .find('button')
    .focus() // avoid Cypress triggering a 'click' before typing (which causes 2 separate toggles, meaning no state change)
    .type('{enter}')

    cy.findAllByTestId('spec-row-item')
    .should('have.length', 1)
    .first()
    .find('button')
    .should('have.attr', 'aria-expanded', 'false')
    .type('{rightarrow}') // expand this folder
    .type('{downarrow}') // move to next row
    .focused() // focused element should be next row
    .type('{enter}') // should close next row

    // now only one link should be shown
    cy.get('[data-cy=spec-row-item] a').should('have.length', 1)
    .and('contain.text', 'Spec-D.spec.tsx')

    // some specific assertions about button label text and aria state
    cy.contains('button', 'src').should('have.attr', 'aria-expanded', 'true')
    cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')
    cy.contains('button', 'utils').should('have.attr', 'aria-expanded', 'true')
  })

  it('collapses and rebuilds tree on specs change', () => {
    const specProp = ref(foundSpecs.slice(0, 3))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.contains('button [data-cy=directory-item]', 'src/components')
    cy.findAllByTestId('spec-file-item').should('have.length', specProp.value.length)

    cy.then(() => {
      specProp.value = foundSpecs.slice(0, 4)
      cy.findAllByTestId('directory-item').first().should('contain', 'src').and('not.contain', '/components')
      cy.findAllByTestId('spec-file-item').should('have.length', specProp.value.length)
    })
  })

  it('displays a spec list tree with an active spec', () => {
    const specStore = useSpecStore()

    specStore.setActiveSpec({
      relative: 'src/components/Spec-B.spec.tsx',
      absolute: '',
      name: 'src/components/Spec-B.spec.tsx',
      fileName: 'src/components/Spec-B.spec.tsx',
      baseName: 'Spec-B.spec.tsx',
    })

    const specProp = ref(foundSpecs.slice(0, 4))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.get('[data-selected-spec="true"] span').should('contain', 'Spec-B').should('have.css', 'color', 'rgb(255, 255, 255)')
    cy.get('[data-selected-spec="false"]').should('have.length', '6')
    .should('contain', 'src')
    .should('contain', 'components')
    .should('contain', 'Spec-A')
    .should('contain', 'Spec-C')
    .should('contain', 'utils')
    .and('contain', 'Spec-D')
  })

  it('restores directory expansion state from a provided cache', () => {
    const specProp = ref(foundSpecs.slice(0, 4))
    const componentsKey = ['src', 'components'].join(getSeparator())
    // simulates the cache as it would be restored from persisted preferences after a UI reload,
    // with the "components" directory previously collapsed. It is reactive because the app hands
    // down the object behind a `ref`, and a plain object would not exercise that tracking.
    const cache = reactive<Record<string, boolean>>({ [componentsKey]: false })

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value} treeExpansionCache={cache}/>
      </div>
    ))

    cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')
    // directories with no cache entry still fall back to expanded by default
    cy.contains('button', 'src').should('have.attr', 'aria-expanded', 'true')
    cy.contains('button', 'utils').should('have.attr', 'aria-expanded', 'true')
  })

  it('writes directory expansion changes into the provided cache', () => {
    const specProp = ref(foundSpecs.slice(0, 4))
    const componentsKey = ['src', 'components'].join(getSeparator())
    const cache = reactive<Record<string, boolean>>({})

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value} treeExpansionCache={cache}/>
      </div>
    ))

    cy.contains('button', 'components').click()
    cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')
    .then(() => {
      expect(cache[componentsKey]).to.eq(false)
    })
  })

  it('keeps the keyboard position in the list when toggling with a cache', () => {
    const specProp = ref(foundSpecs.slice(0, 4))
    const cache = reactive<Record<string, boolean>>({})

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value} treeExpansionCache={cache}/>
      </div>
    ))

    // rows are src > components > Spec-A > Spec-B > Spec-C > utils > Spec-D
    cy.findAllByTestId('spec-row-item').should('have.length', 7)

    cy.contains('button', 'components').focus().type('{enter}')
    cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')

    // Writing into the cache must not rebuild the tree, which would reset the active item and
    // scroll the list back to the top. Arrowing down should reach "utils", the row after the
    // collapsed directory, rather than restarting from the first row.
    cy.focused().type('{downarrow}')
    cy.focused().should('contain.text', 'utils')
  })

  it('keeps a directory collapsed when specs are added', () => {
    const specProp = ref(foundSpecs.slice(0, 4))
    const cache = reactive<Record<string, boolean>>({})
    const addedSpec = { ...foundSpecs[0], baseName: 'Spec-E.spec.tsx', fileName: 'Spec-E', relative: 'src/components/Spec-E.spec.tsx' }

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value} treeExpansionCache={cache}/>
      </div>
    ))

    cy.contains('button', 'components').click()
    cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')

    cy.then(() => {
      specProp.value = [...foundSpecs.slice(0, 4), addedSpec]
    })

    // A collapsed directory stays collapsed once the expansion state is persisted, so a newly
    // added spec inside it stays hidden until the user expands that directory again.
    cy.contains('button', 'components').should('have.attr', 'aria-expanded', 'false')
    cy.findAllByTestId('spec-file-item').should('have.length', 1)
  })
})
