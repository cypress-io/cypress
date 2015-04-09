describe "$Cypress.Cy Traversal Commands", ->
  enterCommandTestingMode()

  fns = [
    {find: "*"}
    {filter: ":first"}
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

      it "errors without a dom element", (done) ->
        @allowErrors()

        @cy.noop({})[name](arg)

        @cy.on "fail", -> done()

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

        it "#onConsole", ->
          @cy.get("#list")[name](arg).then ($el) ->
            obj = {Command: name}
            obj.Selector = [].concat(arg).join(", ") unless _.isFunction(arg)

            _.extend obj, {
              "Applied To": getFirstSubjectByName.call(@, "get")
              Returned: $el
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

  it "errors after timing out not finding element", (done) ->
    @allowErrors()

    @cy._timeout(300)

    @cy.on "fail", (err) ->
      expect(err.message).to.include "Could not find element: span"
      done()

    @cy.get("#list li:last").find("span")
