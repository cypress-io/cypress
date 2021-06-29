import { h, defineComponent, computed } from 'vue'
import RunnableSuites from './RunnableSuite.vue'
import faker from 'faker'
import { rootRunnable } from '@packages/faker'
import { Suite, Runnables } from '../store/reporter-store'
import _ from 'lodash'

// const passingSuite = rootRunnable.suites[0]
// const failingSuite = rootRunnable.suites[1]
// const pendingSuite = rootRunnable.suites[2]

const runnables = Runnables(rootRunnable)

const result = _.groupBy(runnables.nested.filter(r => r.type === 'suite'), 'state')
result;
debugger;

// @ts-ignore
const mountWithProps = (props = {}) => {
  // props.suite = props.suite || passingSuite

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
      // suite: passingSuite,
      ...props
    }
  })
}
describe('Runnable Suite suite states', () => {
  it.only('renders a failing suite', () => {
    mountWithProps({ suite: failingSuite })
  })

  it('renders a passing suite', () => {
    
  })

  it('renders a pending suite', () => {
    
  })
})
describe('RunnableSuite Initial props', () => {
  it('renders', () => {
    mountWithProps()
    .get('[data-cy=title]')
    .should('not.be.empty')
  })

  it('renders the content immediately when initially-open is true', () => {
      // Initially Open
      mountWithProps({ initiallyOpen: true })
      .get('[data-cy=content]')
      .should('be.visible')
  })

  it('does not mount content to the DOM when initially-open is false', () => {
    // Closes when the title is clicked
    mountWithProps({ initiallyOpen: false })
      .get('[data-cy=content]')
      .should('not.exist')
  })
  it('can be toggled open and closed', () => {
    mountWithProps({ initiallyOpen: false })
      .get('[data-cy=title]')
      .should('not.be.empty')
      .get('[data-cy=content]')
      .should('not.exist')
      .get('[data-cy=title]')
      .click()
      .get('[data-cy=content]')
      .click()
      .should('be.visible')
      .get('[data-cy=title]')
      .click()
      .get('[data-cy=content]')
      .should('not.exist')
  })
})