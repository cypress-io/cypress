import { CODE_LANGUAGES } from '@packages/types/src'
import { ref } from 'vue'
import Select from './SelectLanguage.vue'

const manyOptions = CODE_LANGUAGES

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
