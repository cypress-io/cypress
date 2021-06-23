import { Runnables } from './reporter-store'
import rootRunnable from '../../cypress/fixtures/runnables.json'
import { nanoid } from 'nanoid'
import _ from 'lodash'

function makeTest(state): Test {
  return {
    id: nanoid(),
    state,
    type: 'test'
  }
}

it('creates a new store for the root runnables', () => {
  const runnables = Runnables(rootRunnable)
  expect(runnables.flat).to.have.keys

  // Should not be the root one
  // @ts-ignore
  expect(runnables.nested[0].root).not.to.be.true
  expect(runnables.tests).to.have.length
})

it('computes the right number of tests', () => {
  const runnables = Runnables({
    root: true, tests: [
      makeTest('passed'),
      makeTest('passed'),
      makeTest('passed'),
      makeTest('failed'),
      makeTest('failed'),
      makeTest('processing'),
  ]})
  
  expect(_.keys(runnables.testsByState.value)).to.have.members(['passed', 'failed', 'processing'])
  expect(runnables.testsByState.value.passed).to.have.length(3)
  expect(runnables.testsByState.value.failed).to.have.length(2)
})
