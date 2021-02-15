import * as React from 'react'
import { mount } from '@cypress/react'
import * as Size from 'image-size'

type ImageSize = typeof Size.imageSize
type CompareImagesResult = [Buffer, Buffer, ImageSize, ImageSize]

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
  before(() => {
    cy.task('clearScreenshots')
  })

  after(() => {
    cy.task('clearScreenshots')
  })

  it('takes a standard screenshot', () => {
    cy.viewport(500, 500)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('1_takes_a_screenshot')
    cy.task<CompareImagesResult>('compareImages', '1_takes_a_screenshot').then((result) => {
      expect(result[0]).to.eql(result[1])
    })
  })

  it('takes a screenshot with a custom viewport', () => {
    cy.viewport(750, 750)
    mount(<Layout />, {
      styles,
    })

    cy.screenshot('2_screenshot_custom_viewport_screenshot')
    cy.task<CompareImagesResult>('compareImages', '2_screenshot_custom_viewport_screenshot').then((result) => {
      expect(result[0]).to.eql(result[1])
      expect(result[2]).to.deep.eq({ height: 750, width: 750, type: 'png' })
      expect(result[2]).to.deep.eq(result[3])
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
    cy.task<CompareImagesResult>('compareImages', '3_screenshot_long_viewport').then((result) => {
      expect(result[0]).to.eql(result[1])
      expect(result[2]).to.deep.eq({ height: 2000, width: 200, type: 'png' })
      expect(result[2]).to.deep.eq(result[3])
    })
  })
})
