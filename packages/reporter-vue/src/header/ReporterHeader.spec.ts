import ReporterHeader from './ReporterHeader.vue'
import { h, defineComponent, ref } from 'vue'
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

  const Subject = defineComponent({
    setup() {
      const runState = ref('running')
      const statsStore = useStatsStore() 

      return () => h(ReporterHeader, {
        ...props,
        runState: runState.value,
        onPause() {
          console.log('onPause')
          onPauseSpy()
          runState.value = 'paused'
          statsStore.stop()
        },
        onRestart() {
          onRestartSpy()
          runState.value = 'running'
          statsStore.$reset()
          statsStore.start()
        }
      })
    }
  })

  const wrapper = h(Subject)

  cy.mount(wrapper)
    .get('[data-cy=play-pause-toggle]').as('playPause')
    .click()
    .get('@onPause').should('have.been.called')
    .get('@playPause').click()
    .get('@onRestart').should('have.been.called')
    .get('@playPause').click()
})