import { Runnables } from '../store/reporter-store'
import { rootRunnable } from '@packages/faker'
import _ from 'lodash'
import RunnablesList from './RunnablesList.vue'

describe('runnables list', () => it('renders the runnables list', () => {
  // randomness makes this (currently) untestable
  const runnables = Runnables(rootRunnable)

  cy.mount(RunnablesList, {
    props: {
      runnables: runnables.nested,
      root: true,
    }
  })
}))