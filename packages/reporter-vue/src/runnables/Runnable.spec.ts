import { h } from 'vue'
import Runnable from './Runnable.vue'
import faker from 'faker'
import { Suite, Test } from '../store/reporter-store'
import _ from 'lodash'

const makeSuite = (tests) => new Suite({
  suites: [],
  id: faker.datatype.uuid(),
  title: faker.git.commitMessage(),
  level: 0,
  tests: tests || [],
  children: tests || []
})

const makeTest = state => new Test({
  id: faker.datatype.uuid(),
  title: faker.git.commitMessage(),
  level: 0,
  state
})

// @ts-ignore
const mountWithProps = (props = {}) => {
  return cy.mount(Runnable, {
    slots: {
      title() {
        return h('span', props.runnable.title)
      },
      default() {
        return h('span', 'inner content')
      }
    },
    props: {
      runnable: makeSuite([]),
      ...props
    }
  })
}

describe('Runnable Suite suite states', () => {
  it('renders a failing suite', () => {
    mountWithProps({ runnable: makeSuite([{ state: 'failed' }]) })
  })

  it('renders a passing suite', () => {
    mountWithProps({ runnable: makeSuite([{ state: 'passed' }]) })
  })

  it('renders a pending suite', () => {
    mountWithProps({ runnable: makeSuite([{ state: 'pending' }]) })
  })

  it('renders a running suite', () => {
    mountWithProps({ runnable: makeSuite([{ state: 'running' }]) })
  })

  it('renders a not running suite', () => {
    mountWithProps({ runnable: makeSuite([{ state: 'not-started' }]) })
  })
})

describe('Runnable Test test states', () => {
  it('renders a failing test', () => {
    mountWithProps({ runnable: makeTest('failed') })
  })

  it('renders a passing test', () => {
    mountWithProps({ runnable: makeTest('passed') })
  })

  it('renders a pending test', () => {
    mountWithProps({ runnable: makeTest('pending') })
  })

  it('renders a running test', () => {
    mountWithProps({ runnable: makeTest('running') })
  })

  it('renders a not running test', () => {
    mountWithProps({ runnable: makeTest('not-started') })
  })
})

describe('RunnableSuite Initial props', () => {
  it('renders', () => {
    mountWithProps()
    .get('[data-cy=title]')
    .should('not.be.empty')
  })

  it('can be toggled open and closed', () => {
    mountWithProps()
      .get('[data-cy=title]')
      .should('not.be.empty')
      .get('[data-cy=content]')
      .should('be.visible')
      .get('[data-cy=title]')
      .click()
      .get('[data-cy=content]')
      .should('not.exist')
      .get('[data-cy=title]')
      .click()
      .get('[data-cy=content]')
      .should('be.visible')
  })
})