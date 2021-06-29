import { Runnables } from '../store/reporter-store'
import { rootRunnable, suiteContents } from '@packages/faker'
import _ from 'lodash'
import RunnablesList from './RunnablesList.vue'

it('renders the runnables list', () => {
  // randomness makes this (currently) untestable
  const runnables = Runnables(rootRunnable)

  // @ts-ignore
  cy.mount(RunnablesList, {
    props: {
      runnables: runnables.nested,
      root: true,
    }
  })
})