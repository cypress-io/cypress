import { ref } from 'vue'
import SelectFwOrBundler, { Option } from './SelectFwOrBundler.vue'

const manyOptions: Readonly<Option[]> = [
  {
    name: 'Vue.js',
    id: 'vue',
    type: 'vue2',
    isDetected: true,
    supportStatus: 'full',
  },
  {
    name: 'React.js',
    description: '(detected)',
    id: 'react',
    type: 'react',
    supportStatus: 'alpha',
  },
] as const

describe('<SelectFwOrBundler />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="m-10">
        <SelectFwOrBundler
          selectorType="framework"
          label="Front-end Framework"
          options={manyOptions}
          value="react"
        />
      </div>
    ))

    cy.contains('button', 'React.js').click()
  })

  it('renders the name', () => {
    cy.mount(() => <SelectFwOrBundler selectorType="framework" label="Front-end Framework" options={[]} />)

    cy.contains('Front-end Framework').should('exist')
  })

  it('shows detected flag', () => {
    cy.mount(() => (<SelectFwOrBundler
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
      <SelectFwOrBundler
        selectorType="framework"
        label="Front-end Framework"
        placeholder="placeholder"
        options={[
          {
            name: 'VueJs',
            id: 'vue',
            type: 'vueclivue3',
            supportStatus: 'full',
          },
        ]}
      />
    ))

    cy.contains('button', 'placeholder').should('exist')
  })

  it('should select the value', () => {
    cy.mount(() => (
      <SelectFwOrBundler selectorType="framework" label="Front-end Framework" options={manyOptions} value="react" />
    ))

    cy.contains('button', 'React.js').should('exist')
  })

  it('should select the clicked item', () => {
    let val = ref('react')

    cy.mount(() => (
      <SelectFwOrBundler
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
        <SelectFwOrBundler selectorType="framework" label="Front-end Framework" options={manyOptions} value="vue2" />
      </div>
    ))

    cy.contains('button', 'Vue.js').click()
    cy.contains('React.js').should('be.visible')
    cy.contains('click out').click()
    cy.contains('React.js').should('not.exist')
  })
})
