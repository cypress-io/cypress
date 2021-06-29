import { h } from 'vue'
import RunnableSuites from './RunnableSuite.vue'
import faker from 'faker'
import { Suite } from '../store/reporter-store'
import _ from 'lodash'

const makeSuite = (tests) => new Suite({
  suites: [],
  id: faker.datatype.uuid(),
  title: faker.git.commitMessage(),
  level: 0,
  tests: tests || [],
  children: tests || []
})

// @ts-ignore
const mountWithProps = (props = {}) => {
  return cy.mount(RunnableSuites, {
    slots: {
      title() {
        return h('span', props.suite.title)
      },
      default() {
        return h('span', 'inner content')
      }
    },
    props: {
      suite: makeSuite([]),
      ...props
    }
  })
}
describe('Runnable Suite suite states', () => {
  it('renders a failing suite', () => {
    mountWithProps({ suite: makeSuite([{ state: 'failing' }]) })
  })

  it('renders a passing suite', () => {
    mountWithProps({ suite: makeSuite([{ state: 'passed' }]) })
  })

  it('renders a pending suite', () => {
    mountWithProps({ suite: makeSuite([{ state: 'pending' }]) })
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