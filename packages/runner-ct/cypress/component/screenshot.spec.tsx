import * as React from 'react'
import { mount } from '@cypress/react'

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

const Layout: React.FC = () => {
  return (
    <div id='wrapper'>
      <div id='header'>Header</div>
      <div id='body'>Body</div>
      <div id='footer'>Footer</div>
    </div>
  )
}

describe('screenshot', () => {
  it('takes a standard screenshot', () => {
    cy.viewport(500, 500)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('percy/component_testing_takes_a_screenshot')
  })

  it('takes a screenshot with a custom viewport', () => {
    cy.viewport(750, 750)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('percy/component_testing_screenshot_custom_viewport_screenshot')
  })

  it('works with a large component', () => {
    const style = `
      html, body {
        margin: 0;
        padding: 0;
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

    cy.viewport(1500, 1000)

    const Comp = () => {
      return (
        <div className="wrapper">
          <div className="one">One</div>
          <div className="two">Two</div>
          <div className="three">Three</div>
          <div className="four">Four</div>
          <div className="five">Five</div>
          <div className="six">Six</div>
        </div>
      )
    }

    mount(<Comp />, { style }).then(() => {
      cy.screenshot('percy/large_component_hardcoded_width_height')
    })
  })

  it('component that expands to fill viewport height and width', () => {
    const style = `
      .wrapper {
        height: 100vh;
        width: 100vwh
      }
      .content {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `
    const Comp = () => {
      return (
        <div className="wrapper">
          <div className="content">
            We come from the land down under 🎵
          </div>
        </div>
      )
    }

    cy.viewport(150, 1000)
    mount(<Comp />, { style }).then(() => {
      cy.wait(100)
      cy.screenshot('percy/100vh_100vw')
    })
  })

  // TODO: This will technically pass, but the screenshot is not correct.
  // AUT transform appears to be buggy for extreme viewports.
  it('screenshot with a really long viewport', () => {
    cy.viewport(200, 2000)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('percy/component_testing_screenshot_long_viewport')
  })
})
