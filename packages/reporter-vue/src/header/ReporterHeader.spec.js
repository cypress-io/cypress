import ReporterHeader from './ReporterHeader.vue'
import { useStatsStore, useReporterStore } from '../store/reporter-store'
import { rootRunnable } from '@packages/faker'
import { h } from 'vue'

const style = {
  resize: 'both',
  overflow: 'auto',
  display: 'block',
  color: 'black',
  background: 'rgba(100,100,100, 0.1)'
}

it.only('renders', () => {
  const timeout = 1512
  const wrapper = {
    setup() {
      const store = useStatsStore()
      const reporter = useReporterStore()
      reporter.setRunnablesFromRoot(rootRunnable)

      store.start()

      setTimeout(() => {
        store.stop()
      }, timeout)
    },
    
    render() {
      return h('div', { style }, h(ReporterHeader))
    }
  }

  cy.mount(() => h(wrapper))
    // .get('[data-cy=reporter-header]')
    // .get('button').first()
    // .click()
    // .get('@rerun clicked')
    // .should('have.been.called')
})
