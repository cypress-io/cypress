// tslint:disable-next-line: no-implicit-dependencies - cypress
import { mount } from 'cypress/vue'
import type { FunctionalComponent } from 'vue-demi'
import './screenshot.scss'

const Layout: FunctionalComponent = () => {
  return (
    <div id='wrapper'>
      <div id='header'>Header</div>
      <div id='body'>Body</div>
      <div id='footer'>Footer</div>
    </div>
  )
}

const captureTypes = ['fullPage', 'viewport', 'runner'] as const

describe('screenshot', () => {
  captureTypes.forEach((capture) => {
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23424
    if (capture === 'runner') {
      return
    }

    it(`takes a standard screenshot with viewport: ${capture}`, () => {
      cy.viewport(500, 500)
      mount(() => <Layout />)

      cy.screenshot(`percy/component_testing_takes_a_screenshot_viewport_${capture}`, { capture })
    })
  })

  it('takes a screenshot with a custom viewport', () => {
    cy.viewport(750, 750)
    mount(() => <Layout />)

    cy.screenshot('percy/component_testing_screenshot_custom_viewport_screenshot')
  })

  it('screenshot with a really long viewport', () => {
    cy.viewport(200, 2000)
    mount(() => <Layout />)

    cy.screenshot('percy/component_testing_screenshot_long_viewport')
  })

  ;[[1500, 850], [1500, 1000]].forEach((viewport) => {
    it(`works with a large component with viewport ${viewport[0]} x ${viewport[1]}`, () => {
      cy.viewport(viewport[0], viewport[1])

      const Comp: FunctionalComponent = () => {
        return (
          <div class="wrapper">
            <div class="one">One</div>
            <div class="two">Two</div>
            <div class="three">Three</div>
            <div class="four">Four</div>
            <div class="five">Five</div>
            <div class="six">Six</div>
          </div>
        )
      }

      mount(() => <Comp />).then(() => {
        cy.screenshot(`percy/large_component_hardcoded_size_viewport_${viewport[0]}_${viewport[1]}`, { capture: 'viewport' })
        cy.screenshot(`percy/large_component_hardcoded_size_fullPage_${viewport[0]}_${viewport[1]}`, { capture: 'fullPage' })
      })
    })
  })
})
