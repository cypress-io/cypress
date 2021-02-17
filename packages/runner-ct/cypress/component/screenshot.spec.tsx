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

  // TODO: This will technically pass, but the screenshot is not correct.
  // AUT transform appears to be buggy for extreme viewports.
  xit('screenshot with a really long viewport', () => {
    cy.viewport(200, 2000)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('percy/component_testing_screenshot_long_viewport')
  })
})
