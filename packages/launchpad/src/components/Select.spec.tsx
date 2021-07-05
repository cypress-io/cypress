import { ref } from 'vue'
import { Framework } from '../utils/frameworks'
import Select from './Select.vue'
import LogoVue from '../images/logos/vue.svg'
import LogoReact from '../images/logos/react.svg'

const manyOptions = [
  {
    name: 'VueJs',
    logo: LogoVue,
    id: 'vue',
  },
  {
    name: 'ReactJs',
    description: '(detected)',
    logo: LogoReact,
    id: 'react',
  },
]

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

    cy.contains('button', 'ReactJs').click()
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
            logo: 'vue',
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

    cy.contains('button', 'ReactJs').should('exist')
  })

  it('should select the clicked item', () => {
    let val = ref('react')

    cy.mount(() => (
      <Select
        name="Front-end Framework"
        options={manyOptions}
        value={val.value}
        // @ts-ignore
        onSelect={(newVal: Framework) => {
          val.value = newVal.id
        }}
      />
    ))

    cy.contains('button', 'ReactJs').click()
    cy.contains('VueJs').click()
    cy.contains('ReactJs').should('not.exist')
  })

  it('should close when clicking on the body', () => {
    cy.mount(() => (
      <div>
        <div>click out</div>
        <Select name="Front-end Framework" options={manyOptions} value="vue" />
      </div>
    ))

    cy.contains('button', 'VueJs').click()
    cy.contains('ReactJs').should('be.visible')
    cy.contains('click out').click()
    cy.contains('ReactJs').should('not.exist')
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

    cy.contains('button', 'VueJs').click({ force: true })
    cy.contains('ReactJs').should('not.exist')
  })
})
