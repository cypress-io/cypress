// @ts-nocheck
import RunnableDuration from './RunnableDuration.vue'
import { h } from 'vue'

// const stat = '[data-cy=stat]'
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
  // const props = []
  // const labels = []
  // cy.mount(RunnableDuration)
  // Object.entries(durations).forEach(([label, number]) => {
  //   // console.log(type)
  //   types.forEach((type) => {
  //     labels.push(`${type}, ${label}`)
  //     props.push({ number, type })
  //   }
  //   )
  // })

  cy.mount(() => h('div', {style, ...column}, durations.map((duration) => {
    // return h('div', {style: { ...style, ...row }}, [types.map((type) => {
      return h(RunnableDuration, { duration })
    // })])
  })))
})


it('renders', () => {
  cy.mount(RunnableStat, { props: { number: 10, type: 'passed' } })
    .get(stat)
    .should('have.text', '10')
  
  cy.mount(RunnableStat, { props: { number: 0, type: 'failed' } })
    .get('[data-cy=stat]')
})
