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

  context "#ensureElementIsNotAnimating", ->
    beforeEach ->
      @allowErrors()

    it "returns early if waitForAnimations is false", ->
      @sandbox.stub(@Cypress, "config").withArgs("waitForAnimations").returns(false)

      fn = => @cy.ensureElementIsNotAnimating()

      expect(fn).not.to.throw(Error)

    it "throws without enough coords provided to calculate distance", ->
      fn = => @cy.ensureElementIsNotAnimating(null, [])
      expect(fn).to.throw("not enough coord points provided to calculate distance")

    it "throws when element is animating", ->
      @commands = $Cypress.Commands.create()
      @commands.splice(0, 1, {id: 1, name: "foo"})

      cmd = @commands.findWhere({name: "foo"})

      @cy.prop("current", cmd)

      $el    = @cy.$("button:first")
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

  ## WE NEED TO ADD SPECS AROUND THE EXACT ERROR MESSAGE TEXT
  ## SINCE WE ARE NOT ACTUALLY TESTING THE EXACT MESSAGE TEXT
  ## IN OUR ACTIONS SPEC (BECAUSE THEY'RE TOO DAMN LONG)
  ##
  ## OR WE SHOULD JUST MOVE TO AN I18N ERROR SYSTEM AND ASSERT
  ## ON A LOOKUP SYSTEM