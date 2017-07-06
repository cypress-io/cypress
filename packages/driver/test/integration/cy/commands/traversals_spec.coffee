{ $, _ } = window.testUtils

describe "$Cypress.Cy Traversal Commands", ->
  enterCommandTestingMode()

  fns = [
    {find: "*"}
    {filter: ":first"}
    {not: "div"}
    {eq: 0}
    {closest: "body"}
    "children", "first", "last", "next", "nextAll", "nextUntil", "parent", "parents", "parentsUntil", "prev", "prevAll", "prevUntil", "siblings"
  ]
  _.each fns, (fn) ->
    ## normalize string vs object
    if _.isObject(fn)
      name = _.keys(fn)[0]
      arg = fn[name]
    else
      name = fn

    context "##{name}", ->
      it "proxies through to jquery and returns new subject", ->
        el = @cy.$$("#list")[name](arg)
        @cy.get("#list")[name](arg).then ($el) ->
          expect($el).to.match el

      describe "errors", ->
        beforeEach ->
          @currentTest.timeout(150)
          @allowErrors()

        it "throws when options.length isnt a number", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "You must provide a valid number to a length assertion. You passed: 'asdf'"
            done()

          @cy.get("#list")[name](arg).should("have.length", "asdf")

        it "throws on too many elements after timing out waiting for length", (done) ->
          el = @cy.$$("#list")[name](arg)

          node = $Cypress.utils.stringifyElement @cy.$$("#list"), "short"

          @cy.on "fail", (err) ->
            expect(err.message).to.include "Too many elements found. Found '#{el.length}', expected '#{el.length - 1}'."
            done()

          @cy.get("#list")[name](arg).should("have.length", el.length - 1)

        it "throws on too few elements after timing out waiting for length", (done) ->
          el = @cy.$$("#list")[name](arg)

          node = $Cypress.utils.stringifyElement @cy.$$("#list"), "short"

          @cy.on "fail", (err) ->
            expect(err.message).to.include "Not enough elements found. Found '#{el.length}', expected '#{el.length + 1}'."
            done()

          @cy.get("#list")[name](arg).should("have.length", el.length + 1)

        it "without a dom element", (done) ->
          @cy.noop({})[name](arg)
          @cy.on "fail", -> done()

        it "throws when subject is not in the document", (done) ->
          @cy.on "command:end", =>
            @cy.$$("#list").remove()

          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.#{name}() failed because this element"
            done()

          @cy.get("#list")[name](arg)

        it "returns no elements", (done) ->
          @cy._timeout(100)

          errIncludes = (el, node) =>
            node = $Cypress.utils.stringifyElement @cy.$$(node), "short"

            @cy.on "fail", (err) ->
              expect(err.message).to.include "Expected to find element: '#{el}', but never found it. Queried from element: #{node}"
              done()

          switch name
            when "not"
              errIncludes(":checkbox", ":checkbox")
              @cy.get(":checkbox").not(":checkbox")

            ## these cannot error
            when "first", "last", "parentsUntil" then done()

            else
              errIncludes(".no-class-like-this-exists", "div:first")
              @cy.get("div:first")[name](".no-class-like-this-exists")

      describe ".log", ->
        beforeEach ->
          @Cypress.on "log", (attrs, @log) =>

        it "logs immediately before resolving", (done) ->
          @Cypress.on "log", (attrs, log) ->
            if log.get("name") is name
              expect(log.pick("state")).to.deep.eq {
                state: "pending"
              }
              done()

          @cy.get("#list")[name](arg)

        it "snapshots after finding element", ->
          @cy.get("#list")[name](arg).then ->
            expect(@log.get("snapshots").length).to.eq(1)
            expect(@log.get("snapshots")[0]).to.be.an("object")

        it "has the $el", ->
          @cy.get("#list")[name](arg).then ($el) ->
            expect(@log.get("$el").get(0)).to.eq $el.get(0)

        it "has a custom message", ->
          @cy.get("#list")[name](arg).then ->
            arg = if _.isUndefined(arg) then "" else arg.toString()
            expect(@log.get("message")).to.eq arg

        it "#consoleProps", ->
          @cy.get("#list")[name](arg).then ($el) ->
            obj = {Command: name}
            obj.Selector = [].concat(arg).join(", ") unless _.isFunction(arg)

            yielded = @Cypress.utils.getDomElements($el)

            _.extend obj, {
              "Applied To": getFirstSubjectByName.call(@, "get").get(0)
              Yielded: yielded
              Elements: $el.length
            }

            expect(@log.attributes.consoleProps()).to.deep.eq obj

  it "eventually resolves", ->
    _.delay ->
      @cy.$$("button:first").text("foo").addClass("bar")
    , 100

    cy.root().find("button:first").should("have.text", "foo").and("have.class", "bar")

  it "retries until it finds", ->
    li = @cy.$$("#list li:last")
    span = $("<span>foo</span>")

    retry = _.after 3, ->
      li.append(span)

    @cy.on "retry", retry

    @cy.get("#list li:last").find("span").then ($span) ->
      expect($span.get(0)).to.eq(span.get(0))

  it "retries until length equals n", ->
    buttons = @cy.$$("button")

    length = buttons.length - 2

    @cy.on "retry", _.after 2, =>
      buttons.last().remove()
      buttons = @cy.$$("button")

    ## should resolving after removing 2 buttons
    @cy.root().find("button").should("have.length", length).then ($buttons) ->
      expect($buttons.length).to.eq length

  it "should('not.exist')", ->
    @cy.on "retry", _.after 3, =>
      @cy.$$("#nested-div").find("span").remove()

    @cy.get("#nested-div").find("span").should("not.exist")

  it "should('exist')", ->
    @cy.on "retry", _.after 3, =>
      @cy.$$("#nested-div").append($("<strong />"))

    @cy.get("#nested-div").find("strong")

  ## https://github.com/cypress-io/cypress/issues/38
  it "works with checkboxes", ->
    @cy.on "retry", _.after 2, =>
      c = @cy.$$("[name=colors]").slice(0, 2)
      c.prop("checked", true)

    @cy.get("#by-name").find(":checked").should("have.length", 2)

  it "does not log using first w/options", ->
    logs = []

    @Cypress.on "log", (attrs, log) ->
      logs.push log

    @cy.get("button").first({log: false}).then ($button) ->
      expect($button.length).to.eq(1)
      expect(logs.length).to.eq(1)

  describe "deprecated command options", ->
    beforeEach ->
      @allowErrors()

    it "throws on {exist: false}", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.eq "Command Options such as: '{exist: false}' have been deprecated. Instead write this as an assertion: cy.should('not.exist')."
        done()

      @cy.root().find("ul li", {exist: false})

    it "throws on {exists: true}", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.eq "Command Options such as: '{exists: true}' have been deprecated. Instead write this as an assertion: cy.should('exist')."
        done()

      @cy.root().find("ul li", {exists: true, length: 10})

    it "throws on {visible: true}", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.eq "Command Options such as: '{visible: true}' have been deprecated. Instead write this as an assertion: cy.should('be.visible')."
        done()

      @cy.root().find("ul li", {visible: true})

    it "throws on {visible: false}", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.eq "Command Options such as: '{visible: false}' have been deprecated. Instead write this as an assertion: cy.should('not.be.visible')."
        done()

      @cy.root().find("ul li", {visible: false})

    it "throws on {length: 3}", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.eq "Command Options such as: '{length: 3}' have been deprecated. Instead write this as an assertion: cy.should('have.length', '3')."
        done()

      @cy.root().find("ul li", {length: 3})

  describe "errors", ->
    beforeEach ->
      @allowErrors()
      @cy._timeout(300)

    it "errors after timing out not finding element", (done) ->
      @cy.on "fail", (err) ->
        expect(err.message).to.include "Expected to find element: 'span', but never found it. Queried from element: <li.item>"
        done()

      @cy.get("#list li:last").find("span")

    it "throws once when incorrect sizzle selector", (done) ->
      @allowErrors()

      logs = []

      @Cypress.on "log", (attrs, log) ->
        logs.push(log)

      @cy.on "fail", (err) ->
        expect(logs.length).to.eq 2
        done()

      @cy.get("div:first").find(".spinner'")

    it "logs out $el when existing $el is found even on failure", (done) ->
      button = @cy.$$("#button").hide()

      @Cypress.on "log", (attrs, @log) =>

      @cy.on "fail", (err) =>
        expect(@log.get("state")).to.eq("failed")
        expect(@log.get("error")).to.eq err
        expect(@log.get("$el").get(0)).to.eq button.get(0)
        consoleProps = @log.attributes.consoleProps()
        expect(consoleProps.Yielded).to.eq button.get(0)
        expect(consoleProps.Elements).to.eq button.length
        done()

      @cy.get("#dom").find("#button").should("be.visible")
