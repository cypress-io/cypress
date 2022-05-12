const { devicePixelRatio } = window
const path = require('path')

describe('taking screenshots within cy.origin', () => {
  it('crops app captures to just app size', () => {
    cy.viewport(600, 400)

    cy.visit('/')
    cy.origin('http://foobar.com:3322', () => {
      cy.visit('http://www.foobar.com:3322/color/yellow')
      cy.screenshot('crop-check', { capture: 'viewport' })
    })

    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/crop-check.png`,
      width: 600,
      height: 400,
      devicePixelRatio,
    })
  })

  it('can capture fullPage screenshots', () => {
    cy.viewport(600, 200)

    cy.visit('/')
    cy.origin('http://foobar.com:3322', () => {
      cy.visit('http://www.foobar.com:3322/fullPage')
      cy.screenshot('fullPage', { capture: 'fullPage' })
    })

    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/fullPage.png`,
      width: 600,
      height: 500,
      devicePixelRatio,
    })
  })

  it('accepts subsequent same captures after multiple tries', () => {
    cy.viewport(600, 200)

    cy.visit('/')
    cy.origin('http://foobar.com:3322', () => {
      cy.visit('http://www.foobar.com:3322/fullPage-same')
      cy.screenshot('fullPage-same', { capture: 'fullPage' })
    })

    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/fullPage-same.png`,
      width: 600,
      height: 500,
      devicePixelRatio,
    })
  })

  it('can capture element screenshots', () => {
    cy.viewport(600, 200)

    cy.visit('/')
    cy.origin('http://foobar.com:3322', () => {
      cy.visit('http://www.foobar.com:3322/element')
      cy.get('.element').screenshot('element')
    })

    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/element.png`,
      width: 400,
      height: 300,
      devicePixelRatio,
    })
  })

  describe('clipping', () => {
    it('can clip app screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://foobar.com:3322', () => {
        cy.visit('http://www.foobar.com:3322/color/yellow')
        cy.screenshot('app-clip', {
          capture: 'viewport', clip: { x: 10, y: 10, width: 100, height: 50 },
        })
      })

      cy.task('check:screenshot:size', {
        name: `${path.basename(__filename)}/app-clip.png`,
        width: 100,
        height: 50,
        devicePixelRatio,
      })
    })

    it('can clip runner screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://foobar.com:3322', () => {
        cy.visit('http://www.foobar.com:3322/color/yellow')
        cy.screenshot('runner-clip', {
          capture: 'runner', clip: { x: 15, y: 15, width: 120, height: 60 },
        })
      })

      cy.task('check:screenshot:size', {
        name: `${path.basename(__filename)}/runner-clip.png`,
        width: 120,
        height: 60,
        devicePixelRatio,
      })
    })

    it('can clip fullPage screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://foobar.com:3322', () => {
        cy.visit('http://www.foobar.com:3322/fullPage')
        cy.screenshot('fullPage-clip', {
          capture: 'fullPage', clip: { x: 20, y: 20, width: 140, height: 70 },
        })
      })

      cy.task('check:screenshot:size', {
        name: `${path.basename(__filename)}/fullPage-clip.png`,
        width: 140,
        height: 70,
        devicePixelRatio,
      })
    })

    it('can clip element screenshots', () => {
      cy.viewport(600, 200)

      cy.visit('/')
      cy.origin('http://foobar.com:3322', () => {
        cy.visit('http://www.foobar.com:3322/element')
        cy.get('.element').screenshot('element-clip', {
          clip: { x: 25, y: 25, width: 160, height: 80 },
        })
      })

      cy.task('check:screenshot:size', {
        name: `${path.basename(__filename)}/element-clip.png`,
        width: 160,
        height: 80,
        devicePixelRatio,
      })
    })
  })
})
