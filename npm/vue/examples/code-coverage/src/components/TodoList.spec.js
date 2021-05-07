import { mount } from '@cypress/vue'
import TodoList from './TodoList.vue'

describe('<TodoList />', () => {
  it('Playground', () => {
    mount(TodoList)
  })
})
