import { ref } from 'vue'
import Radio from './Radio.vue'

describe('<Radio />', () => {
  it('should be updating values', () => {
    const value = ref('private')

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

    cy.mount(() => (<div class="px-24px">
      <Radio onUpdate:value={(val) => value.value = val}
        value={value.value}
        name="projectAccess"
        label="Project Access"
        options={options} />
    </div>))

    cy.contains('Public').click().then(() => {
      expect(value.value).to.eq('public')
    })
  })
})
