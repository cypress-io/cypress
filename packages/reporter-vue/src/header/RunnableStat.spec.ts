// @ts-nocheck
import RunnableStat from './RunnableStat.vue'
import type { StatType } from '../store/stats-store'
import { h } from 'vue'

const stat = '[data-cy=stat]'
const types: StatType[] = ['passed', 'failed', 'pending']
const numbers = [123, 20, 1, 0]

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
  const props = []
  const labels = []
  Object.entries(numbers).forEach(([label, number]) => {
    // console.log(type)
    types.forEach((type) => {
      labels.push(`${type}, ${label}`)
      props.push({ number, type })
    }
    )
  })

  cy.mount(() => h('div', {style, ...column}, numbers.map((number) => {
    return h('div', {style: { ...style, ...row }}, [types.map((type) => {
      return h(RunnableStat, { type, number })
    })])
  })))
})


it('renders', () => {
  cy.mount(RunnableStat, { props: { number: 10, type: 'passed' } })
    .get(stat)
    .should('have.text', '10')
  
  cy.mount(RunnableStat, { props: { number: 0, type: 'failed' } })
    .get('[data-cy=stat]')
})
