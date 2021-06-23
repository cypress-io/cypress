import RunnableDuration from './RunnableDuration.vue'
import { h } from 'vue'
import { mount } from '@cypress/vue'

const durations = [109240192, 10219.291, 123.20, 24, 1, 0]

const style = {
  display: 'grid',
  gap: '2px',
  resize: 'both',
  overflow: 'auto'  
}

const column = {
  'flex-direction': 'column',
  'justify-items': 'center',
  'width': 'auto',
}
const row = {
  'grid-template-columns': 'repeat(3, auto)', 
}

it.only('renders all states ', () => {
  mount(() => h('div', {style, ...column}, durations.map((duration) => {
    return h(RunnableDuration, { duration })
  })))
})


it('renders', () => {
  mount(RunnableStat, { props: { number: 10, type: 'passed' } })
    .get(stat)
    .should('have.text', '10')
  
  mount(RunnableStat, { props: { number: 0, type: 'failed' } })
    .get('[data-cy=stat]')
})
