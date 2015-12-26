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

      expect(fn).to.throw("cy.foo() failed because this element you are chaining off of has become detached or removed from the DOM:\n\n<button>foo</button>\n\nhttp://on.cypress.io/element-has-detached-from-dom")

  ## WE NEED TO ADD SPECS AROUND THE EXACT ERROR MESSAGE TEXT
  ## SINCE WE ARE NOT ACTUALLY TESTING THE EXACT MESSAGE TEXT
  ## IN OUR ACTIONS SPEC (BECAUSE THEY'RE TOO DAMN LONG)
  ##
  ## OR WE SHOULD JUST MOVE TO AN I18N ERROR SYSTEM AND ASSERT
  ## ON A LOOKUP SYSTEM