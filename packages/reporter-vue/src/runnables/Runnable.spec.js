import Runnable from './Runnable'
import { singleTest } from './mock-runnables'

it.only('renders', () => {
  cy.mount(Runnable, { props: { runnable: singleTest }})
})

describe('empty suite', () => {
})

describe('full suite', () => {
  it('also renders', () => {

  })
})