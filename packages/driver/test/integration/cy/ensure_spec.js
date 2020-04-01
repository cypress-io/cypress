/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { $, _ } = window.testUtils

describe('$Cypress.Cy Ensure Extensions', function () {
  enterCommandTestingMode()

  it('adds 4 methods', function () {
    return _.each(['Subject', 'Parent', 'Visibility', 'Dom'], (name) => {
      return expect(this.cy[`ensure${name}`]).to.be.a('function')
    })
  })

  context('#ensureDom', function () {
    beforeEach(function () {
      return this.allowErrors()
    })

    return it('stringifies node + references wiki', function () {
      const button = $('<button>foo</button>')

      const fn = () => this.cy.ensureDom(button, 'foo')

      return expect(fn).to.throw('cy.foo() failed because this element you are chaining off of has become detached or removed from the DOM:\n\n<button>foo</button>\n\nhttps://on.cypress.io/element-has-detached-from-dom')
    })
  })

  context('#ensureElExistence', () => {
    return it('always unbinds before:log if assertion fails', function () {
      const fn = () => {
        return this.cy.ensureElExistence($())
      }

      expect(fn).to.throw('to exist in the DOM')

      return expect(this.cy.state('onBeforeLog')).to.be.null
    })
  })

  context('#ensureElementIsNotAnimating', function () {
    beforeEach(function () {
      return this.allowErrors()
    })

    it('returns early if waitForAnimations is false', function () {
      this.sandbox.stub(this.Cypress, 'config').withArgs('waitForAnimations').returns(false)

      const fn = () => this.cy.ensureElementIsNotAnimating()

      return expect(fn).not.to.throw(Error)
    })

    it('throws without enough coords provided to calculate distance', function () {
      const fn = () => this.cy.ensureElementIsNotAnimating(null, [])

      return expect(fn).to.throw('Not enough coord points provided to calculate distance')
    })

    it('throws when element is animating', function () {
      this.cy.state('current', { get () {
        return 'foo'
      } })

      const $el = this.cy.$$('button:first')
      const coords = [{ x: 10, y: 20 }, { x: 20, y: 30 }]

      const fn = () => this.cy.ensureElementIsNotAnimating($el, coords)

      return expect(fn).to.throw('cy.foo() could not be issued because this element is currently animating:\n')
    })

    it('does not throw when threshold has been increased', function () {
      this.sandbox.stub(this.Cypress, 'config').withArgs('animationDistanceThreshold').returns(100)

      const coords = [{ x: 10, y: 20 }, { x: 20, y: 30 }]

      const fn = () => this.cy.ensureElementIsNotAnimating(null, coords)

      return expect(fn).not.to.throw
    })

    it('does not throw when threshold argument has been increased', function () {
      const coords = [{ x: 10, y: 20 }, { x: 20, y: 30 }]

      const fn = () => this.cy.ensureElementIsNotAnimating(null, coords, 100)

      return expect(fn).not.to.throw
    })

    return it('does not throw when distance is below threshold', function () {
      const coords = [{ x: 10, y: 20 }, { x: 8, y: 18 }]

      const fn = () => {
        return this.cy.ensureElementIsNotAnimating(null, coords)
      }

      return expect(fn).not.to.throw(Error)
    })
  })

  context('#ensureValidPosition', function () {
    beforeEach(function () {
      return this.allowErrors()
    })

    it('throws when invalid position', function () {
      const fn = () => this.cy.ensureValidPosition('foo')

      return expect(fn).to.throw('Invalid position argument: \'foo\'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')
    })

    return it('does not throws when valid position', function () {
      const fn = () => this.cy.ensureValidPosition('topRight')

      return expect(fn).to.not.throw
    })
  })

  return context('#ensureScrollability', function () {
    beforeEach(function () {
      this.allowErrors()

      this.add = (el) => {
        return $(el).appendTo(this.cy.$$('body'))
      }
    })

    it('defaults to current command if not specified', function () {
      this.cy.$$('body').html('<div>foo</div>')
      const win = this.cy.state('window')

      this.cy.state('current', {
        get () {
          return 'currentCmd'
        },
      })

      const fn = () => this.cy.ensureScrollability(win)

      return expect(fn).to.throw('cy.currentCmd() failed because this element is not scrollable:\n\n<window>\n')
    })

    it('does not throw when window and body > window height', function () {
      const win = this.cy.state('window')

      const fn = () => this.cy.ensureScrollability(win, 'foo')

      return expect(fn).not.to.throw(Error)
    })

    it('throws when window and body > window height', function () {
      this.cy.$$('body').html('<div>foo</div>')

      const win = this.cy.state('window')

      const fn = () => this.cy.ensureScrollability(win, 'foo')

      return expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<window>\n')
    })

    it('throws when el is not scrollable', function () {
      const noScroll = this.add(`\
<div style="height: 100px; overflow: auto;">
  <div>No Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(noScroll, 'foo')

      return expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<div style="height: 100px; overflow: auto;">...</div>\n')
    })

    it('throws when el has no overflow', function () {
      const noOverflow = this.add(`\
<div style="height: 100px; width: 100px; border: 1px solid green;">
  <div style="height: 150px;">
    No Overflow Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada magna mollis euismod.
  </div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(noOverflow, 'foo')

      return expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<div style="height: 100px; width: 100px; border: 1px solid green;">...</div>\n')
    })

    it('does not throw when vertically scrollable', function () {
      const vertScrollable = this.add(`\
<div style="height: 100px; width: 100px; overflow: auto;">
  <div style="height: 150px;">Vertical Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(vertScrollable, 'foo')

      return expect(fn).not.to.throw(Error)
    })

    it('does not throw when horizontal scrollable', function () {
      const horizScrollable = this.add(`\
<div style="height: 100px; width: 100px; overflow: auto; ">
  <div style="height: 150px;">Horizontal Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(horizScrollable, 'foo')

      return expect(fn).not.to.throw(Error)
    })

    return it('does not throw when overflow scroll forced and content larger', function () {
      const forcedScroll = this.add(`\
<div style="height: 100px; width: 100px; overflow: scroll; border: 1px solid yellow;">
  <div style="height: 300px; width: 300px;">Forced Scroll</div>
</div>\
`)

      const fn = () => this.cy.ensureScrollability(forcedScroll, 'foo')

      return expect(fn).not.to.throw(Error)
    })
  })
})

// WE NEED TO ADD SPECS AROUND THE EXACT ERROR MESSAGE TEXT
// SINCE WE ARE NOT ACTUALLY TESTING THE EXACT MESSAGE TEXT
// IN OUR ACTIONS SPEC (BECAUSE THEY'RE TOO DAMN LONG)
//
// OR WE SHOULD JUST MOVE TO AN I18N ERROR SYSTEM AND ASSERT
// ON A LOOKUP SYSTEM
