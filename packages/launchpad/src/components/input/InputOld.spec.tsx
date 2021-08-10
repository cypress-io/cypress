import { ref } from 'vue'
import InputOld from './InputOld.vue'
import CoffeeIcon from 'virtual:vite-icons/mdi/coffee'
import HeartIcon from 'virtual:vite-icons/mdi/heart'

describe('<InputOld />', () => {
  it('playground', () => {
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    const visible = ref(true)
    const text = ref('hello world')

    cy.mount(() => (
      <div class='m-10'>
        <div>
          Input with text:
          <InputOld modelValue={lorem} />
        </div>

        <div>Input with Icon
          <InputOld
            modelValue={lorem}
            prefixIcon={HeartIcon}
            prefixIconClass='text-gray-cool-500'
          />
        </div>

        <div>Input with Icon
          <InputOld
            modelValue={lorem}
            prefixIcon={HeartIcon}
            prefixIconClass='text-gray-cool-500'
            suffixIcon={CoffeeIcon}
            suffixIconClass='text-gray-cool-500'
          />
        </div>

        <div>
          Input with text, disabled:
          <InputOld disabled modelValue={lorem} />
        </div>

        <div>
          Secure input with text:
          <InputOld
            type={visible.value ? 'text' : 'password'}
            modelValue={text.value}
          />
          <button onClick={() => visible.value = !visible.value}>
            Toggle
          </button>
        </div>

        <div>
          Secure input with text (disabled):
          <InputOld
            type={visible.value ? 'text' : 'password'}
            modelValue={text.value}
            disabled
          />
          <button onClick={() => visible.value = !visible.value}>Toggle</button>
        </div>

        <div>
          Search input:
          <InputOld data-testid='search' type='search'/>
        </div>
      </div>
    ))
  })
})
