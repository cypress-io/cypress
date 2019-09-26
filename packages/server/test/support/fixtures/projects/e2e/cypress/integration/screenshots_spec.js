const { devicePixelRatio } = window
const path = require('path')

describe('taking screenshots', () => {
  let failureTestRan = false
  const onAfterScreenshotResults = []

  Cypress.Screenshot.defaults({
    onAfterScreenshot ($el, results) {
      onAfterScreenshotResults.push(results)
    },
  })

  it('manually generates pngs', () => {
    cy.visit('http://localhost:3322/color/black')
    cy.screenshot('black', { capture: 'runner' })
    cy.wait(1500)
    cy.visit('http://localhost:3322/color/red')
    cy.screenshot('red', { capture: 'runner' })
  })

  it('can nest screenshots in folders', () => {
    cy.visit('http://localhost:3322/color/white')
    cy.screenshot('foo/bar/baz', { capture: 'runner' })
  })

  it('generates pngs on failure', () => {
    failureTestRan = true

    cy.visit('http://localhost:3322/color/yellow')
    cy.wait(1500)
    .then(() => {
      // failure 1
      throw new Error('fail whale')
    })
  })

  it('calls onAfterScreenshot with results of failed tests', () => {
    // this test will only pass if the previous test ran
    if (!failureTestRan) {
      throw new Error('this test can only pass if the previous test ran')
    }

    const testFailure = Cypress._.find(onAfterScreenshotResults, {
      testFailure: true,
    })

    expect(testFailure).to.exist

    expect(Cypress._.map(onAfterScreenshotResults, 'name')).to.deep.eq([
      'black', 'red', 'foo/bar/baz', undefined,
    ])
  })

  it('handles devicePixelRatio correctly on headless electron', () => {
    // this checks to see if the topLeftRight pixel (1, 0) is
    // currently white. when electron runs offscreen it upscales
    // images incorrectly on retina screens and the algorithm
    // blurs this pixel into gray.
    cy.screenshot('color-check', { capture: 'runner' })
    cy.task('ensure:pixel:color', {
      devicePixelRatio,
      coords: [1, 0],
      color: [255, 255, 255], // white
      name: `${path.basename(__filename)}/color-check`,
    })

    cy.task('ensure:pixel:color', {
      devicePixelRatio,
      coords: [0, 1],
      color: [255, 255, 255], // white
      name: `${path.basename(__filename)}/color-check`,
    })
  })

  it('crops app captures to just app size', () => {
    cy.viewport(600, 400)
    cy.visit('http://localhost:3322/color/yellow')
    cy.screenshot('crop-check', { capture: 'viewport' })
    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/crop-check.png`,
      width: 600,
      height: 400,
      devicePixelRatio,
    })
  })

  it('can capture fullPage screenshots', () => {
    cy.viewport(600, 200)
    cy.visit('http://localhost:3322/fullPage')
    cy.screenshot('fullPage', { capture: 'fullPage' })
    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/fullPage.png`,
      width: 600,
      height: 500,
      devicePixelRatio,
    })
  })

  it('accepts subsequent same captures after multiple tries', () => {
    cy.viewport(600, 200)
    cy.visit('http://localhost:3322/fullPage-same')
    cy.screenshot('fullPage-same', { capture: 'fullPage' })
    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/fullPage-same.png`,
      width: 600,
      height: 500,
      devicePixelRatio,
    })
  })

  it('accepts screenshot after multiple tries if somehow app has pixels that match helper pixels', () => {
    cy.viewport(1280, 720)
    cy.visit('http://localhost:3322/pathological')
    cy.screenshot('pathological', { capture: 'viewport' })
  })

  it('can capture element screenshots', () => {
    cy.viewport(600, 200)
    cy.visit('http://localhost:3322/element')
    cy.get('.element')
    .screenshot('element')

    cy.task('check:screenshot:size', {
      name: `${path.basename(__filename)}/element.png`,
      width: 400,
      height: 300,
      devicePixelRatio,
    })
  })

  it('retries each screenshot for up to 1500ms', () => {
    cy.viewport(400, 400)
    cy.visit('http://localhost:3322/identical')
    cy.get('div:first').should('have.css', 'height', '1300px')
    .screenshot({
      onAfterScreenshot ($el, results) {
        let fourth; let third

        expect($el).to.match('div')

        const { duration } = results

        // there should be 4 screenshots taken
        // because the height is 1700px.
        // the 1st will resolve super fast since it
        // won't match any other screenshots.
        // the 2nd/3rd will take up to their 1500ms
        // because they will be identical to the first.
        // the 4th will also go quickly because it will not
        // match the 3rd
        const first = (fourth = 250)
        const second = (third = 1500)
        const total = first + second + third + fourth
        const padding = 2000 // account for slower machines

        expect(duration).to.be.within(total, total + padding)
      },
    })
  })

  it('ensures unique paths for non-named screenshots', () => {
    cy.screenshot({ capture: 'runner' })
    cy.screenshot({ capture: 'runner' })
    cy.screenshot({ capture: 'runner' })
    cy.readFile(`cypress/screenshots/${path.basename(__filename)}/taking screenshots -- ensures unique paths for non-named screenshots.png`, 'base64')
    cy.readFile(`cypress/screenshots/${path.basename(__filename)}/taking screenshots -- ensures unique paths for non-named screenshots (1).png`, 'base64')

    cy.readFile(`cypress/screenshots/${path.basename(__filename)}/taking screenshots -- ensures unique paths for non-named screenshots (2).png`, 'base64')
  })

  it('ensures unique paths when there\'s a non-named screenshot and a failure', () => {
    cy.screenshot({ capture: 'viewport' }).then(() => {
      throw new Error('failing on purpose')
    })
  })

  describe('clipping', () => {
    it('can clip app screenshots', () => {
      cy.viewport(600, 200)
      cy.visit('http://localhost:3322/color/yellow')
      cy.screenshot('app-clip', {
        capture: 'viewport', clip: { x: 10, y: 10, width: 100, height: 50 },
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
      cy.visit('http://localhost:3322/color/yellow')
      cy.screenshot('runner-clip', {
        capture: 'runner', clip: { x: 15, y: 15, width: 120, height: 60 },
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
      cy.visit('http://localhost:3322/fullPage')
      cy.screenshot('fullPage-clip', {
        capture: 'fullPage', clip: { x: 20, y: 20, width: 140, height: 70 },
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
      cy.visit('http://localhost:3322/element')
      cy.get('.element')
      .screenshot('element-clip', {
        clip: { x: 25, y: 25, width: 160, height: 80 },
      })

      cy.task('check:screenshot:size', {
        name: `${path.basename(__filename)}/element-clip.png`,
        width: 160,
        height: 80,
        devicePixelRatio,
      })
    })
  })

  it('does not take a screenshot for a pending test', function () {
    this.skip()
  })

  context('before hooks', () => {
    before(() => {
      // failure 2
      throw new Error('before hook failing')
    })

    it('empty test 1', () => {})
  })

  context('each hooks', () => {
    beforeEach(() => {
      // failure 3
      throw new Error('before each hook failed')
    })

    afterEach(() => {
      // failure 3 still (since associated only to a single test)
      throw new Error('after each hook failed')
    })

    it('empty test 2', () => {})
  })

  context(`really long test title ${Cypress._.repeat('a', 255)}`, () => {
    it('takes a screenshot', () => {
      cy.screenshot()
    })

    it('takes another screenshot', () => {
      cy.screenshot()
    })
  })
})
