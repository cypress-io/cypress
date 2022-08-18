import { mount } from 'cypress/vue'
import type { FunctionalComponent } from 'vue-demi'

const styles = `
  body {
    margin: 0; 
  }
  #wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
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
`

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

function removeGlobalStyles () {
  // To help with consistency over time when diffing the images produce in this test
  // this function removes global app styles after mounting,
  // so that only the CSS injected by the component will be applied.

  cy.get('style').each((item) => {
    if (item[0].dataset.cy !== 'injected-style-tag') {
      item.remove()
    }
  })

  return cy.get('style').should('have.length', 1)
}

describe('screenshot', () => {
  captureTypes.forEach((capture) => {
    it(`takes a standard screenshot with viewport: ${capture}`, () => {
      cy.viewport(500, 500)
      mount(() => <Layout />, {
        styles,
      })

      removeGlobalStyles()
      cy.screenshot(`percy/component_testing_takes_a_screenshot_viewport_${capture}`, { capture })
    })
  })

  it('takes a screenshot with a custom viewport', () => {
    cy.viewport(750, 750)
    mount(() => <Layout />, {
      styles,
    })

    removeGlobalStyles()
    cy.screenshot('percy/component_testing_screenshot_custom_viewport_screenshot')
  })

  it('screenshot with a really long viewport', () => {
    cy.viewport(200, 2000)
    mount(() => <Layout />, {
      styles,
    })

    removeGlobalStyles()
    cy.screenshot('percy/component_testing_screenshot_long_viewport')
  })

  const style = `
    html, body {
      margin: 0;
      padding: 0;
    }
    * {
    box-sizing: content-box;
    }
    .wrapper {
      width: 1500px;
      height: 1000px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      grid-auto-rows: minmax(100px, auto);
    }
    .wrapper > div {
      border: 5px solid orange;
      border-radius: 10px;
      padding: 10px;
      margin: 10px;
      background: rgba(233,171,88,.5);
    }
    .one {
      grid-column: 1 / 3;
      grid-row: 1;
    }
    .two {
      grid-column: 2 / 4;
      grid-row: 1 / 3;
    }
    .three {
      grid-column: 1;
      grid-row: 2 / 5;
    }
    .four {
      grid-column: 3;
      grid-row: 3;
    }
    .five {
      grid-column: 2;
      grid-row: 4;
    }
    .six {
      grid-column: 3;
      grid-row: 4;
    }
  `

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

      mount(() => <Comp />, { style }).then(() => {
        removeGlobalStyles()
        cy.screenshot(`percy/large_component_hardcoded_size_viewport_${viewport[0]}_${viewport[1]}`, { capture: 'viewport' })
        cy.screenshot(`percy/large_component_hardcoded_size_fullPage_${viewport[0]}_${viewport[1]}`, { capture: 'fullPage' })
      })
    })
  })
})
