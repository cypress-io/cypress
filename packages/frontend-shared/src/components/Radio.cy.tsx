import { ref } from 'vue'
import Radio from './Radio.vue'

describe('<Radio />', () => {
  const options = [
    {
      label: 'Private',
      description: 'Only invited users can view recorded test results',
      value: 'private',
    },
    {
      label: 'Public',
      description: 'Everyone can view recorded test results',
      value: 'public',
    },
  ]

  it('should be updating values', () => {
    const value = ref('private')

    cy.mount(() => (<div class="px-[24px]">
      <Radio onUpdate:value={(val) => value.value = val}
        value={value.value}
        name="projectAccess"
        label="Project Access"
        options={options} />
    </div>))

    cy.findByText('Public').click().then(() => {
      expect(value.value).to.eq('public')
    })
  })

  it('can use the option slot to customize rendering of options', () => {
    const value = ref('private')

    cy.mount(() => (<div class="px-[24px]">
      <Radio onUpdate:value={(val) => value.value = val}
        value={value.value}
        name="projectAccess"
        label="Project Access"
        options={options}
        v-slots={{
          option: ({ option, checked }) => <div>foo - {option.label} {checked ? '(checked)' : ''}</div>,
        }}/>
    </div>))

    cy.findByText('foo - Private (checked)').should('be.visible')
    cy.findByText('foo - Public').should('be.visible')
  })
})
