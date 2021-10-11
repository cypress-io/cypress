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

describe('<BigSelect />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="m-10">
        <Select
          name="Language"
          options={manyOptions}
          value="1"
        />
      </div>
    ))

    cy.contains('Button', 'JavaScript').click()
  })
})
