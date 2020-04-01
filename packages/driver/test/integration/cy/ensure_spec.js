const { $, _ } = window.testUtils

describe('$Cypress.Cy Ensure Extensions', () => {
  // eslint-disable-next-line no-undef
  enterCommandTestingMode()

  it('adds 4 methods', () => {
    return _.each(['Subject', 'Parent', 'Visibility', 'Dom'], (name) => {
      expect(this.cy[`ensure${name}`]).to.be.a('function')
    })
  })

  context('#ensureDom', () => {
    beforeEach(() => {
      return this.allowErrors()
    })

    it('stringifies node + references wiki', () => {
      const button = $('<button>foo</button>')

      const fn = () => this.cy.ensureDom(button, 'foo')

      expect(fn).to.throw('cy.foo() failed because this element you are chaining off of has become detached or removed from the DOM:\n\n<button>foo</button>\n\nhttps://on.cypress.io/element-has-detached-from-dom')
    })
  })

  context('#ensureElExistence', () => {
    it('always unbinds before:log if assertion fails', () => {
      const fn = () => {
        return this.cy.ensureElExistence($())
      }

      expect(fn).to.throw('to exist in the DOM')

      expect(this.cy.state('onBeforeLog')).to.be.null
    })
  })

  context('#ensureElementIsNotAnimating', () => {
    beforeEach(() => {
      return this.allowErrors()
    })

    it('returns early if waitForAnimations is false', () => {
      this.sandbox.stub(this.Cypress, 'config').withArgs('waitForAnimations').returns(false)

      const fn = () => this.cy.ensureElementIsNotAnimating()

      expect(fn).not.to.throw(Error)
    })

    it('throws without enough coords provided to calculate distance', () => {
      const fn = () => this.cy.ensureElementIsNotAnimating(null, [])

      expect(fn).to.throw('Not enough coord points provided to calculate distance')
    })

    it('throws when element is animating', () => {
      this.cy.state('current', { get () {
        return 'foo'
      } })

      const $el = this.cy.$$('button:first')
      const coords = [{ x: 10, y: 20 }, { x: 20, y: 30 }]

      const fn = () => this.cy.ensureElementIsNotAnimating($el, coords)

      expect(fn).to.throw('cy.foo() could not be issued because this element is currently animating:\n')
    })

    it('does not throw when threshold has been increased', () => {
      this.sandbox.stub(this.Cypress, 'config').withArgs('animationDistanceThreshold').returns(100)

      const coords = [{ x: 10, y: 20 }, { x: 20, y: 30 }]

      const fn = () => this.cy.ensureElementIsNotAnimating(null, coords)

      expect(fn).not.to.throw
    })

    it('does not throw when threshold argument has been increased', () => {
      const coords = [{ x: 10, y: 20 }, { x: 20, y: 30 }]

      const fn = () => this.cy.ensureElementIsNotAnimating(null, coords, 100)

      expect(fn).not.to.throw
    })

    it('does not throw when distance is below threshold', () => {
      const coords = [{ x: 10, y: 20 }, { x: 8, y: 18 }]

      const fn = () => {
        return this.cy.ensureElementIsNotAnimating(null, coords)
      }

      expect(fn).not.to.throw(Error)
    })
  })

  context('#ensureValidPosition', () => {
    beforeEach(() => {
      return this.allowErrors()
    })

    it('throws when invalid position', () => {
      const fn = () => this.cy.ensureValidPosition('foo')

      expect(fn).to.throw('Invalid position argument: \'foo\'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')
    })

    it('does not throws when valid position', () => {
      const fn = () => this.cy.ensureValidPosition('topRight')

      expect(fn).to.not.throw
    })
  })

  context('#ensureScrollability', () => {
    beforeEach(() => {
      this.allowErrors()

      this.add = (el) => {
        return $(el).appendTo(this.cy.$$('body'))
      }
    })

    it('defaults to current command if not specified', () => {
      this.cy.$$('body').html('<div>foo</div>')
      const win = this.cy.state('window')

      this.cy.state('current', {
        get () {
          return 'currentCmd'
        },
      })

      const fn = () => this.cy.ensureScrollability(win)

      expect(fn).to.throw('cy.currentCmd() failed because this element is not scrollable:\n\n<window>\n')
    })

    it('does not throw when window and body > window height', () => {
      const win = this.cy.state('window')

      const fn = () => this.cy.ensureScrollability(win, 'foo')

      expect(fn).not.to.throw(Error)
    })

    it('throws when window and body > window height', () => {
      this.cy.$$('body').html('<div>foo</div>')

      const win = this.cy.state('window')

      const fn = () => this.cy.ensureScrollability(win, 'foo')

      expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<window>\n')
    })

    it('throws when el is not scrollable', () => {
      const noScroll = this.add(`\
<div style="height: 100px; overflow: auto;">
  <div>No Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(noScroll, 'foo')

      expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<div style="height: 100px; overflow: auto;">...</div>\n')
    })

    it('throws when el has no overflow', () => {
      const noOverflow = this.add(`\
<div style="height: 100px; width: 100px; border: 1px solid green;">
  <div style="height: 150px;">
    No Overflow Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada magna mollis euismod.
  </div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(noOverflow, 'foo')

      expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<div style="height: 100px; width: 100px; border: 1px solid green;">...</div>\n')
    })

    it('does not throw when vertically scrollable', () => {
      const vertScrollable = this.add(`\
<div style="height: 100px; width: 100px; overflow: auto;">
  <div style="height: 150px;">Vertical Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(vertScrollable, 'foo')

      expect(fn).not.to.throw(Error)
    })

    it('does not throw when horizontal scrollable', () => {
      const horizScrollable = this.add(`\
<div style="height: 100px; width: 100px; overflow: auto; ">
  <div style="height: 150px;">Horizontal Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(horizScrollable, 'foo')

      expect(fn).not.to.throw(Error)
    })

    it('does not throw when overflow scroll forced and content larger', () => {
      const forcedScroll = this.add(`\
<div style="height: 100px; width: 100px; overflow: scroll; border: 1px solid yellow;">
  <div style="height: 300px; width: 300px;">Forced Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(forcedScroll, 'foo')

      expect(fn).not.to.throw(Error)
    })
  })
})
