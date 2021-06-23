import ReporterHeader from './ReporterHeader.vue'
import {useStatsStore, useReporterStore, defaultStats} from '../store'
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

      cy.spy(reporter, 'rerun').as('rerun clicked')
      cy.spy(reporter, 'toggleAutoScrolling').as('toggle autoscrolling')
      cy.spy(reporter, 'stopRunning').as('stop tests clicked')

      store.start({
        ...defaultStats,
        numberOfPassed: 2,
        startTime: Date.now()
      })

      setTimeout(() => {
        store.stop()
      }, timeout)
    },
    
    render() {
      return h('div', { style }, h(ReporterHeader))
    }
  }

  cy.mount(() => h(wrapper))
    .get('[data-cy=reporter-header]')
    .get('button').first()
    .click()
    .get('@rerun clicked')
    .should('have.been.called')
})
