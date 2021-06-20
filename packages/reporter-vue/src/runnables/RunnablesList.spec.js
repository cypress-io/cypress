import RunnablesList from './RunnablesList'
import { mockRootRunnable } from './mock-runnables'
import { useRunnablesStore } from '../store'
import { h } from 'vue'

it('renders', () => {
  const wrapper = {
    setup() {
      const runnablesStore = useRunnablesStore()
      runnablesStore.rootRunnable = mockRootRunnable

      debugger;
      return () => h(RunnablesList)
    }
  }
  cy.mount(() => h(wrapper))
})