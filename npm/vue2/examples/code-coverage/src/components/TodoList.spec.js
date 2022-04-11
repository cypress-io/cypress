import { mount } from '@cypress/vue2'
import TodoList from './TodoList.vue'

describe('<TodoList />', () => {
  it('Playground', () => {
    mount(TodoList)
  })
})
