// @ts-nocheck
import Hook from './Hook.vue'
import { Runnables } from '../store/reporter-store'
import { runnableWithHooks } from '@packages/faker/hooks'
import { h } from 'vue'

const hooksRunnable = Runnables(runnableWithHooks)

const beforeEachHook = hooksRunnable.getHook({ hookId: 'h2', testId: 'r3' })

const testBodyHook = hooksRunnable.getHook({ hookId: 'r3', testId: 'r3' })

const failedHook = hooksRunnable.getHook({ hookId: 'h1', testId: 'r6' })

debugger;
const style = {
  border: '1px solid black',
  padding: '10px',
}

it('renders a before each without siblings', () => {
  cy.mount(() => {
    debugger;
    return h('div', { style }, h(Hook, {
        hook: beforeEachHook,
        count: 1,
        idx: 0
      })
    )
  })
})

it('renders a test body', () => {
  cy.mount(() => {
    debugger;
    return h('div', { style }, h(Hook, {
        hook: testBodyHook,
        count: 1,
        idx: 0
      })
    )
  })
})

it('renders a failed hook', () => {
  cy.mount(() => {
    debugger;
    return h('div', { style }, h(Hook, {
        hook: failedHook,
        count: 1,
        idx: 0
      })
    )
  })
})