import ReporterHeader from './ReporterHeader.vue'
import { h } from 'vue'
import { useStatsStore } from '../store/reporter-store'


const props = {
  runState: 'running',
  stats: {
    failed: 1,
    passed: 9,
    pending: 2,
  },
}

it('is renders the timer and can be played/paused', () => {
  const onRestartSpy = cy.spy().as('onRestart')
  const onPauseSpy = cy.spy().as('onPause')
  const wrapper = h({
    // The parent component will provide runState
    data() {
      return {
        runState: 'running'
      }
    },
    setup: () => ({ statsStore: useStatsStore() }),
    render() {
      const _this = this
      return h(ReporterHeader, {
        ...props,
        runState: _this.runState, // pass runState in
        onPause() {
          onPauseSpy()
          _this.runState = 'paused'
          _this.statsStore.stop()
        },
        onRestart() {
          onRestartSpy()
          _this.runState = 'running'
          _this.statsStore.$reset()
          _this.statsStore.start()
        }
      })
    }
  })

  cy.mount(wrapper)
    .get('[data-cy=play-pause-toggle]').as('playPause')
    .click()
    .get('@onPause').should('have.been.called')
    .get('@playPause').click()
    .get('@onRestart').should('have.been.called')
    .get('@playPause').click()
})
