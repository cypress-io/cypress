import { ref } from 'vue'
import type { CodeLanguageEnum } from '../../generated/graphql-test'
import Select from './SelectLanguage.vue'

const manyOptions = [
  {
    id: 'js',
    name: 'JavaScript',
    isSelected: true,
    type: 'js' as CodeLanguageEnum,
  },
  {
    id: 'ts',
    name: 'TypeScript',
    isSelected: false,
    type: 'ts' as CodeLanguageEnum,
  },
]

describe('<SelectLanguage />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="m-10">
        <Select
          name="Language"
          options={manyOptions}
          value="js"
        />
      </div>
    ))

    cy.contains('Button', 'JavaScript').should('exist')
  })

  it('changes the language when clicking', () => {
    const val = ref('js')

    cy.mount(() => (
      <div class="m-10">
        <Select
          name="Language"
          options={manyOptions}
          value={val.value}
          onSelect={(newVal) => {
            val.value = newVal
          }}
        />
      </div>
    ))

    cy.contains('Button', 'TypeScript').click().then(() => {
      expect(val.value).to.equal('ts')
    })
  })
})
