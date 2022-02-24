import { mount } from '@cypress/vue'
import type { FunctionalComponent } from 'vue-demi'

const styles = `
  body {
    margin: 0; 
  }
  #wrapper {
    display: flex;
    flex-direction: column;
    height: 400px;
  }
  #body {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #header, #footer {
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: silver;
  }
  #spinner {
    width: 100px;
    height: 100px;
    background-color: hotpink;
    animation-name: spin;
    animation-duration: 5000ms;
    animation-iteration-count: infinite;
    animation-timing-function: linear; 
  }
`

const Layout: FunctionalComponent = () => {
  return (
    <div id='wrapper'>
      <div id='header'>Header</div>
      <div id='body'>Body
        <div id="spinner"></div>
      </div>
      <div id='footer'>Footer</div>
    </div>
  )
}

// const captureTypes = ['fullPage', 'viewport', 'runner'] as const

describe('screenshot', () => {
  // captureTypes.forEach((capture) => {
  //   it(`takes a standard screenshot with viewport: ${capture}`, () => {
  //     cy.viewport(500, 500)
  //     mount(() => <Layout />, {
  //       styles,
  //     })

  //     cy.screenshot(`percy/component_testing_takes_a_screenshot_viewport_${capture}`, { capture })
  //   })
  // })

  it('takes a screenshot with expected arguments', () => {
    cy.viewport(750, 750)
    mount(() => <Layout />, {
      styles,
    })

    Cypress.Screenshot.defaults({
      capture: 'runner',
    })

    cy.screenshot('percy/validate-screenshot')
  })
})
