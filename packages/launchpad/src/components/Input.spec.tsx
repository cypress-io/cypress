import { ref } from 'vue'
import Input from './Input.vue'
import CoffeeIcon from 'virtual:vite-icons/mdi/coffee'
import HeartIcon from 'virtual:vite-icons/mdi/heart'

describe('<Input />', () => {
  it('playground', () => {
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    const visible = ref(true)
    let text = ref("hello world")
    cy.mount(() => (
      <div class="m-10">
      <div>
        Input with text:
        <Input modelValue={lorem} />
      </div>

      <div>Input with Icon
      <Input modelValue={ lorem } prefixIcon={ HeartIcon } prefixIconClasses="text-gray-cool-500"></Input>
      </div>

      <div>Input with Icon
      <Input data-testid="suffix-icon" modelValue={ lorem } prefixIcon={HeartIcon} prefixIconClasses="text-gray-cool-500" suffixIcon={ CoffeeIcon } suffixIconClass="text-gray-cool-500"></Input>
      </div>

      <div>
        Input with text, disabled:
        <Input disabled modelValue={lorem} />
      </div>

      <div>
        Secure input with text:
        <Input type={visible.value ? "text" : "password"} modelValue={text.value} onChange={(e) => text.value = e.target.value}/>
        <button onClick={() => visible.value = !visible.value}>Toggle</button>
      </div>

      <div>
        Secure input with text (disabled):
        <Input type={visible.value ? "text" : "password"} modelValue={text.value} onChange={(e) => text.value = e.target.value} disabled/>
        <button onClick={() => visible.value = !visible.value}>Toggle</button>
      </div>

      <div>
        Search input:
        <Input data-testid="search" type="search"/>
      </div>
      </div>
    )).get('[data-testid=suffix-icon]').focus().click()
      // .get('[data-testid=search]').focus().click().type('Lorem ipsum dolor sit amet, consectetur adipisicing elit. Incidunt cum, rerum atque perferendis eum quia reiciendis adipisci? Libero tempore nesciunt alias provident? Ab vel non deserunt rerum magni quo sit?', { delay: 0})
  })
})
