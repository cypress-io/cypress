import { ref } from 'vue'
import SelectFrameworkOrBundler from './SelectFrameworkOrBundler.vue'
import type { Option } from './types'

const manyOptions: Readonly<Option[]> = [
  {
    name: 'Vue.js',
    id: 'vue',
    type: 'vue',
    isDetected: true,
    supportStatus: 'full',
  },
  {
    name: 'React.js',
    id: 'react',
    type: 'react',
    supportStatus: 'alpha',
  },
] as const

describe('<SelectFrameworkOrBundler />', () => {
  it('renders the name', () => {
    cy.mount(() => <SelectFrameworkOrBundler selectorType="framework" label="Front-end Framework" options={[]} />)

    cy.contains('Front-end Framework').should('exist')
  })

  it('shows detected flag', () => {
    cy.mount(() => (<SelectFrameworkOrBundler
      label="Front-end Framework"
      selectorType="framework"
      options={manyOptions}
      value="react"
    />))

    cy.contains('React.js').click()
    cy.contains('li', 'Vue.js').contains('(detected)').should('be.visible')
  })

  it('shows a placeholder when no value is specified', () => {
    cy.mount(() => (
      <SelectFrameworkOrBundler
        selectorType="framework"
        label="Front-end Framework"
        placeholder="placeholder"
        options={[
          {
            name: 'VueJs',
            id: 'vue',
            type: 'vite',
            supportStatus: 'full',
          },
        ]}
      />
    ))

    cy.contains('button', 'placeholder').should('exist')
  })

  it('shows a community integration', () => {
    cy.mount(() => (
      <SelectFrameworkOrBundler
        selectorType="framework"
        label="Front-end Framework"
        placeholder="placeholder"
        options={[
          {
            name: 'Solid.js',
            id: 'cypress-ct-solid-js',
            type: 'cypress-ct-solid-js',
            supportStatus: 'community',
          },
        ]}
        value='cypress-ct-solid-js'
      />
    ))

    cy.contains('button', 'Solid.js').click()
    cy.findByTestId('external').should('have.attr', 'href', 'https://on.cypress.io/component-integrations?utm_medium=Select+Framework+Dropdown&utm_source=Binary%3A+Launchpad&utm_campaign=Browse+third-party+frameworks').contains('Browse our list of third-party framework integrations')
    cy.get('[data-testid="icon-check"]').should('be.visible')
  })

  it('should select the value', () => {
    cy.mount(() => (
      <SelectFrameworkOrBundler selectorType="framework" label="Front-end Framework" options={manyOptions} value="react" />
    ))

    cy.contains('button', 'React.js').should('exist')
  })

  it('should select the clicked item', () => {
    let val = ref('react')

    cy.mount(() => (
      <SelectFrameworkOrBundler
        label="Front-end Framework"
        selectorType="framework"
        options={manyOptions}
        value={val.value}
        // @ts-ignore
        onSelectFramework={(newVal: FrontendFramework) => {
          val.value = newVal
        }}
      />
    ))

    cy.contains('button', 'React.js').click()
    cy.contains('Vue.js').click()
    cy.contains('React.js').should('not.exist')
  })

  it('should close when clicking on the body', () => {
    cy.mount(() => (
      <div>
        <div>click out</div>
        <SelectFrameworkOrBundler selectorType="framework" label="Front-end Framework" options={manyOptions} value="vue" />
      </div>
    ))

    cy.contains('button', 'Vue.js').click()
    cy.contains('React.js').should('be.visible')
    cy.contains('click out').click()
    cy.contains('React.js').should('not.exist')
  })
})
