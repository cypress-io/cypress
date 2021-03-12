import React from 'react'
import { mount } from '@cypress/react'

const viewportWidth = 200
const viewportHeight = 100

describe('cypress.json viewport',
  { viewportWidth, viewportHeight },
  () => {
    it('should have the correct dimensions', () => {
      // cy.should cannot be the first cy command we run
      cy.window().should((w) => {
        expect(w.innerWidth).to.eq(viewportWidth)
        expect(w.innerHeight).to.eq(viewportHeight)
      })
    })
  })

describe('cy.viewport', () => {
  it('should resize the viewport', () => {
    cy.viewport(viewportWidth, viewportHeight).should(() => {
      expect(window.innerWidth).to.eq(viewportWidth)
      expect(window.innerHeight).to.eq(viewportHeight)
    })
  })

  it('should make it scale down when overflowing', () => {
    mount(<p>
      Lorem, ipsum dolor sit amet consectetur adipisicing elit.
      Incidunt necessitatibus quia quo obcaecati tempora numquam nobis
      minima libero vel? Nam sequi iusto quod fugit vel rerum eligendi beatae voluptatibus numquam.
    </p>)

    expect(getComputedStyle(window.parent.document.querySelector('iframe').parentElement).transform).to.contain('matrix(1')
    cy.viewport(2000, 200).should(() => {
      expect(getComputedStyle(window.parent.document.querySelector('iframe').parentElement).transform).not.to.contain('matrix(1')
    })
  })
})
