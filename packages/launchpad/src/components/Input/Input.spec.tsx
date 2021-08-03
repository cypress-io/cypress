import { ref } from 'vue'
import Input from './Input.vue'
import CoffeeIcon from 'virtual:vite-icons/mdi/coffee'
import HeartIcon from 'virtual:vite-icons/mdi/heart'

describe('<Input />', () => {
  it('playground', () => {
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    const visible = ref(true)
    const text = ref('hello world')

    cy.mount(() => (
      <div class='m-10'>
        <div>
          Input with text:
          <Input modelValue={lorem} />
        </div>

        <div>Input with Icon
          <Input
            modelValue={lorem}
            prefixIcon={HeartIcon}
            prefixIconClasses='text-gray-cool-500'
          />
        </div>

        <div>Input with Icon
          <Input
            modelValue={lorem}
            prefixIcon={HeartIcon}
            prefixIconClasses='text-gray-cool-500'
            suffixIcon={CoffeeIcon}
            suffixIconClass='text-gray-cool-500'
          />
        </div>

        <div>
          Input with text, disabled:
          <Input disabled modelValue={lorem} />
        </div>

        <div>
          Secure input with text:
          <Input
            type={visible.value ? 'text' : 'password'}
            modelValue={text.value}
            onChange={(e: KeyboardEvent) => text.value = (e.target as HTMLInputElement).value}
          />
          <button onClick={() => visible.value = !visible.value}>
            Toggle
          </button>
        </div>

        <div>
          Secure input with text (disabled):
          <Input
            type={visible.value ? 'text' : 'password'}
            modelValue={text.value}
            onChange={(e: KeyboardEvent) => text.value = (e.target as HTMLInputElement).value}
            disabled
          />
          <button onClick={() => visible.value = !visible.value}>Toggle</button>
        </div>

        <div>
          Search input:
          <Input data-testid='search' type='search'/>
        </div>
      </div>
    ))
  })
})
