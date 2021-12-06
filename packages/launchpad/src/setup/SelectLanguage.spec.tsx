import { ref } from 'vue'
import Select from './SelectLanguage.vue'

const manyOptions = [
  {
    id: 'js',
    name: 'JavaScript',
    isSelected: true,
    type: 'js',
  },
  {
    id: 'ts',
    name: 'TypeScript',
    isSelected: false,
    type: 'ts',
  },
]

describe('<SelectLanguage />', () => {
  it('playground', () => {
    cy.mount(() => (
      <div class="m-10">
        <Select
          name="Language"
          // @ts-ignore
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
          // @ts-ignore
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
