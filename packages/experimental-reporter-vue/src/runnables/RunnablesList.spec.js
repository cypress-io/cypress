import RunnablesList from './RunnablesList'
import { mockRootRunnable } from './mock-runnables'
import { useStore } from '../store'
import { h } from 'vue'

it('renders', () => {
  const wrapper = {
    setup() {
      const store = useStore()
      store.setRunnablesFromRoot(require('@packages/reporter/cypress/fixtures/runnables'))
      return () => h('div', [h(RunnablesList, {
          runnables: store.runnablesTree
        })])
    }
  }
  cy.mount(() => h(wrapper))
})