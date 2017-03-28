describe "$Cypress.Cy Ensure Extensions", ->
  enterCommandTestingMode()

  it "adds 4 methods", ->
    _.each ["Subject", "Parent", "Visibility", "Dom"], (name) =>
      expect(@cy["ensure" + name]).to.be.a("function")

  context "#ensureDom", ->
    beforeEach ->
      @allowErrors()

    it "stringifies node + references wiki", ->
      button = $("<button>foo</button>")

      fn = => @cy.ensureDom(button, "foo")

      expect(fn).to.throw("cy.foo() failed because this element you are chaining off of has become detached or removed from the DOM:\n\n<button>foo</button>\n\nhttps://on.cypress.io/element-has-detached-from-dom")

  context "#ensureElExistence", ->
    it "always unbinds before:log if assertion fails", ->
      fn = =>
        @cy.ensureElExistence($())

      expect(fn).to.throw("to exist in the DOM")
      expect(@cy.prop("onBeforeLog")).to.be.null

  context "#ensureElementIsNotAnimating", ->
    beforeEach ->
      @allowErrors()

    it "returns early if waitForAnimations is false", ->
      @sandbox.stub(@Cypress, "config").withArgs("waitForAnimations").returns(false)

      fn = => @cy.ensureElementIsNotAnimating()

      expect(fn).not.to.throw(Error)

    it "throws without enough coords provided to calculate distance", ->
      fn = => @cy.ensureElementIsNotAnimating(null, [])
      expect(fn).to.throw("Not enough coord points provided to calculate distance")

    it "throws when element is animating", ->
      @commands = $Cypress.Commands.create()
      @commands.splice(0, 1, {id: 1, name: "foo"})

      cmd = @commands.findWhere({name: "foo"})

      @cy.prop("current", cmd)

      $el    = @cy.$$("button:first")
      coords = [{x: 10, y: 20}, {x: 20, y: 30}]

      fn = => @cy.ensureElementIsNotAnimating($el, coords)
      expect(fn).to.throw("cy.foo() could not be issued because this element is currently animating:\n")

    it "does not throw when threshold has been increased", ->
      @sandbox.stub(@Cypress, "config").withArgs("animationDistanceThreshold").returns(100)

      coords = [{x: 10, y: 20}, {x: 20, y: 30}]

      fn = => @cy.ensureElementIsNotAnimating(null, coords)
      expect(fn).not.to.throw

    it "does not throw when threshold argument has been increased", ->
      coords = [{x: 10, y: 20}, {x: 20, y: 30}]

      fn = => @cy.ensureElementIsNotAnimating(null, coords, 100)
      expect(fn).not.to.throw

    it "does not throw when distance is below threshold", ->
      coords = [{x: 10, y: 20}, {x: 8, y: 18}]

      fn = =>
        @cy.ensureElementIsNotAnimating(null, coords)

      expect(fn).not.to.throw(Error)

  context "#ensureScrollability", ->
    beforeEach ->
      @allowErrors()

      @add = (el) =>
        $(el).appendTo(@cy.$$("body"))

    it "throws when el is not scrollable", ->
      noScroll = @add """
        <div style="height: 100px; overflow: auto;">
          <div>No Scroll</div>
        </div>
        """

      fn = => @cy.ensureScrollability(noScroll, "foo")

      expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<div style="height: 100px; overflow: auto;">...</div>\n')

    it "throws when el has no overflow", ->
      noOverflow = @add """
        <div style="height: 100px; width: 100px;">
          <div style="height: 150px;">No Overflow</div>
        </div>
        """

      fn = => @cy.ensureScrollability(noOverflow, "foo")

      expect(fn).to.throw('cy.foo() failed because this element is not scrollable:\n\n<div style="height: 100px; width: 100px;">...</div>\n')

    it "returns early when vertically scrollable", ->
      vertScrollable = @add """
        <div style="height: 100px; width: 100px; overflow: auto;">
          <div style="height: 150px;">Vertical Scroll</div>
        </div>
      """

      fn = => @cy.ensureScrollability(vertScrollable, "foo")

      expect(fn).not.to.throw(Error)

    it "returns early when horizontal scrollable", ->
      horizScrollable = @add """
        <div style="height: 100px; width: 100px; overflow: auto; ">
          <div style="height: 150px;">Horizontal Scroll</div>
        </div>
      """

      fn = => @cy.ensureScrollability(horizScrollable, "foo")

      expect(fn).not.to.throw(Error)

    it "returns early when overflow scroll forced", ->
      forcedScroll = @add """
        <div style="height: 100px; width: 100px; overflow: scroll; ">
          <div>Forced Scroll</div>
        </div>
      """

      fn = => @cy.ensureScrollability(forcedScroll, "foo")

      expect(fn).not.to.throw(Error)

  ## WE NEED TO ADD SPECS AROUND THE EXACT ERROR MESSAGE TEXT
  ## SINCE WE ARE NOT ACTUALLY TESTING THE EXACT MESSAGE TEXT
  ## IN OUR ACTIONS SPEC (BECAUSE THEY'RE TOO DAMN LONG)
  ##
  ## OR WE SHOULD JUST MOVE TO AN I18N ERROR SYSTEM AND ASSERT
  ## ON A LOOKUP SYSTEM
