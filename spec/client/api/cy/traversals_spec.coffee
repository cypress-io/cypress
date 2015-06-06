describe "$Cypress.Cy Traversal Commands", ->
  enterCommandTestingMode()

  fns = [
    {find: "*"}
    {filter: ":first"}
    {not: "div"}
    {eq: 0}
    {closest: "body"}
    "children", "first", "last", "next", "parent", "parents", "prev", "siblings"
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
        el = @cy.$("#list")[name](arg)
        @cy.get("#list")[name](arg).then ($el) ->
          expect($el).to.match el

      describe "errors", ->
        beforeEach ->
          @currentTest.timeout(150)
          @allowErrors()

        it "throws when options.length isnt a number", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "options.length must be a number"
            done()

          @cy.get("#list")[name](arg, {length: "asdf"})

        it "throws on too many elements after timing out waiting for length", (done) ->
          el = @cy.$("#list")[name](arg)

          node = $Cypress.Utils.stringifyElement @cy.$("#list"), "short"

          @cy.on "fail", (err) ->
            expect(err.message).to.include "Too many elements found. Found '#{el.length}', expected '#{el.length - 1}': #{arg ? ''} from #{node}"
            done()

          @cy.get("#list")[name](arg, {length: el.length - 1})

        it "throws on too few elements after timing out waiting for length", (done) ->
          el = @cy.$("#list")[name](arg)

          node = $Cypress.Utils.stringifyElement @cy.$("#list"), "short"

          @cy.on "fail", (err) ->
            expect(err.message).to.include "Not enough elements found. Found '#{el.length}', expected '#{el.length + 1}': #{arg ? ''} from #{node}"
            done()

          @cy.get("#list")[name](arg, {length: el.length + 1})

        it "without a dom element", (done) ->
          @cy.noop({})[name](arg)
          @cy.on "fail", -> done()

        it "throws when subject is not in the document", (done) ->
          @cy.on "command:end", =>
            @cy.$("#list").remove()

          @cy.on "fail", (err) ->
            expect(err.message).to.eq "Cannot call .#{name}() because the current subject has been removed or detached from the DOM."
            done()

          @cy.get("#list")[name](arg)

        it "returns no elements", (done) ->
          @cy._timeout(100)

          errIncludes = (el, node) =>
            node = $Cypress.Utils.stringifyElement @cy.$(node), "short"

            @cy.on "fail", (err) ->
              expect(err.message).to.include "Could not find element: #{el} from #{node}"
              done()

          switch name
            when "not"
              errIncludes(":checkbox", ":checkbox")
              @cy.get(":checkbox").not(":checkbox")

            ## these cannot error
            when "first", "last" then done()

            else
              errIncludes(".no-class-like-this-exists", "div:first")
              @cy.get("div:first")[name](".no-class-like-this-exists")

      describe ".log", ->
        beforeEach ->
          @Cypress.on "log", (@log) =>

        it "logs immediately before resolving", (done) ->
          @Cypress.on "log", (log) ->
            if log.get("name") is name
              expect(log.pick("state")).to.deep.eq {
                state: "pending"
              }
              done()

          @cy.get("#list")[name](arg)

        it "snapshots after finding element", ->
          @cy.get("#list")[name](arg).then ->
            expect(@log.get("snapshot")).to.be.an("object")

        it "has the $el", ->
          @cy.get("#list")[name](arg).then ($el) ->
            expect(@log.get("$el").get(0)).to.eq $el.get(0)

        it "has a custom message", ->
          @cy.get("#list")[name](arg).then ->
            arg = if _.isUndefined(arg) then "" else arg.toString()
            expect(@log.get("message")).to.eq arg

        it "#onConsole", ->
          @cy.get("#list")[name](arg).then ($el) ->
            obj = {Command: name}
            obj.Selector = [].concat(arg).join(", ") unless _.isFunction(arg)

            returned = @Cypress.Utils.getDomElements($el)

            _.extend obj, {
              "Applied To": getFirstSubjectByName.call(@, "get").get(0)
              Options: undefined
              Returned: returned
              Elements: $el.length
            }

            expect(@log.attributes.onConsole()).to.deep.eq obj

  it "retries until it finds", ->
    li = @cy.$("#list li:last")
    span = $("<span>foo</span>")

    retry = _.after 3, ->
      li.append(span)

    @cy.on "retry", retry

    @cy.get("#list li:last").find("span").then ($span) ->
      expect($span.get(0)).to.eq(span.get(0))

  it "retries until length equals n", ->
    buttons = @cy.$("button")

    length = buttons.length - 2

    @cy.on "retry", _.after 2, =>
      buttons.last().remove()
      buttons = @cy.$("button")

    ## should resolving after removing 2 buttons
    @cy.root().find("button", {length: length}).then ($buttons) ->
      expect($buttons.length).to.eq length

  ## https://github.com/cypress-io/cypress/issues/38
  it "works with checkboxes", ->
    @cy.on "retry", _.after 2, =>
      c = @cy.$("[name=colors]").slice(0, 2)
      c.prop("checked", true)

    @cy.get("#by-name").find(":checked", {length: 2})

  it "errors after timing out not finding element", (done) ->
    @allowErrors()

    @cy._timeout(300)

    @cy.on "fail", (err) ->
      expect(err.message).to.include "Could not find element: span"
      done()

    @cy.get("#list li:last").find("span")

  it "throws once when incorrect sizzle selector", (done) ->
    @allowErrors()

    logs = []

    @Cypress.on "log", (log) ->
      logs.push(log)

    @cy.on "fail", (err) ->
      expect(logs.length).to.eq 2
      done()

    @cy.get("div:first").find(".spinner'")

  context "delta + options", ->
    beforeEach ->
      @Cypress.on "log", (@log) =>

    it "compacts message without a selector", ->
      @cy.get("#list").children({visible: true}).then ->
        expect(@log.get("message")).to.eq "{visible: true}"

    it "logs out to message", ->
      @cy.get("#list").find("li:first", {visible: true}).then ->
        expect(@log.get("message")).to.eq "li:first, {visible: true}"

    it "logs command option: length", ->
      @cy.on "retry", _.after 2, =>
        c = @cy.$("[name=colors]").slice(0, 2)
        c.prop("checked", true)

      @cy.get("#by-name").find(":checked", {length: 2}).then ->
        expect(@log.get("message")).to.eq ":checked, {length: 2}"

    it "logs exist: false", ->
      @cy.get("div:first").find("#does-not-exist", {exist: false}).then ->
        expect(@log.get("message")).to.eq "#does-not-exist, {exist: false}"

    it "has options onConsole", ->
      @cy.get("#list").find("li:first", {visible: true}).then ($el) ->
        obj = {
          Command: "find"
          Selector: "li:first"
          Options: {visible: true}
          "Applied To": getFirstSubjectByName.call(@, "get").get(0)
          Returned: $el.get(0)
          Elements: $el.length
        }

        expect(@log.attributes.onConsole()).to.deep.eq obj
