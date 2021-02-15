import * as React from 'react'
import { mount } from '@cypress/react'

type ODiffResult = { match: boolean }

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
  beforeEach(() => {
    cy.task('clearScreenshots')
  })

  afterEach(() => {
    cy.task('clearScreenshots')
  })

  it('takes a standard screenshot', () => {
    cy.viewport(500, 500)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('1_takes_a_screenshot')
    cy.task<ODiffResult>('compareImages', '1_takes_a_screenshot').then((result) => {
      expect(result.match).to.be.true
    })
  })

  it('takes a screenshot with a custom viewport', () => {
    cy.viewport(750, 750)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('2_screenshot_custom_viewport_screenshot')
    cy.task<ODiffResult>('compareImages', '2_screenshot_custom_viewport_screenshot').then((result) => {
      expect(result.match).to.be.true
    })
  })

  // TODO: This will technically pass, but the screenshot is not correct.
  // AUT transform appears to be buggy for extreme viewports.
  xit('screenshot with a really long viewport', () => {
    cy.viewport(200, 2000)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('3_screenshot_long_viewport')
    cy.task<ODiffResult>('compareImages', '3_screenshot_long_viewport').then((result) => {
      expect(result.match).to.be.true
    })
  })
})
