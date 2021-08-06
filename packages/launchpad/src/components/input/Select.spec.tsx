import Select from './Select.vue'
import { ref } from 'vue'

describe('<Select />', () => {
  it('renders a list of options', () => {
    const options = [
      {
        firstName: 'Stefan',
        lastName: 'Rowe',
        age: 51,
        avatar: 'https://s3.amazonaws.com/uifaces/faces/twitter/geneseleznev/128.jpg',
        id: '15972246-9fdd-55b2-80f5-2c10ad58b994',
      },
      {
        firstName: 'Percy',
        lastName: 'Dach',
        age: 57,
        avatar: 'https://s3.amazonaws.com/uifaces/faces/twitter/ivanfilipovbg/128.jpg',
        id: '6edf6445-3f16-54e0-a714-582b467e70e2',
      },
      {
        firstName: 'Dolores',
        lastName: 'Senger',
        age: 25,
        avatar: 'https://s3.amazonaws.com/uifaces/faces/twitter/iduuck/128.jpg',
        id: '9a717a19-4344-546d-8fe7-e581938a5c23',
      },
    ]

    const myValue = ref(options[0])
    const trigger = (newValue) => {
      myValue.value = newValue
    }

    cy.mount(() => <Select key="id" item-value="firstName" label="A label goes here." modelValue={myValue.value} onUpdate:modelValue={trigger} options={options} label-by="label"/>)
  })
})
