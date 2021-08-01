import { ref } from 'vue'
import { FrontendFramework } from '../generated/graphql-test'
import Select from './Select.vue'

const manyOptions = [
  {
    name: 'Vue.js',
    id: 'vue',
  },
  {
    name: 'React.js',
    description: '(detected)',
    id: 'react',
  },
] as const

describe('<BigSelect />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="m-10">
        <Select
          name="Front-end Framework"
          options={manyOptions}
          value="react"
        />
      </div>
    ))

    cy.contains('button', 'React.js').click()
  })

  it('renders the name', () => {
    cy.mount(() => <Select name="Front-end Framework" options={[]} />)

    cy.contains('Front-end Framework').should('exist')
  })

  it('shows a placeholder when no value is specified', () => {
    cy.mount(() => (
      <Select
        name="Front-end Framework"
        placeholder="placeholder"
        options={[
          {
            name: 'VueJs',
            id: 'vue',
          },
        ]}
      />
    ))

    cy.contains('button', 'placeholder').should('exist')
  })

  it('should select the value', () => {
    cy.mount(() => (
      <Select name="Front-end Framework" options={manyOptions} value="react" />
    ))

    cy.contains('button', 'React.js').should('exist')
  })

  it('should select the clicked item', () => {
    let val = ref('react')

    cy.mount(() => (
      <Select
        name="Front-end Framework"
        options={manyOptions}
        value={val.value}
        // @ts-ignore
        onSelect={(newVal: FrontendFramework) => {
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
        <Select name="Front-end Framework" options={manyOptions} value="vue" />
      </div>
    ))

    cy.contains('button', 'Vue.js').click()
    cy.contains('React.js').should('be.visible')
    cy.contains('click out').click()
    cy.contains('React.js').should('not.exist')
  })

  it('should not budge when disabled', () => {
    cy.mount(() => (
      <div class="m-10">
        <Select
          name="Front-end Framework"
          options={manyOptions}
          value="vue"
          disabled
        />
      </div>
    ))

    cy.contains('button', 'Vue.js').click({ force: true })
    cy.contains('React.js').should('not.exist')
  })
})
