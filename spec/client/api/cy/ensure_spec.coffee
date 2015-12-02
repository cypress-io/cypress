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

      expect(fn).to.throw("cy.foo() failed because this element you are chaining off of has become detached or removed from the DOM:\n\n<button></button>\n\nhttp://on.cypress.io/element-has-detached-from-dom")
