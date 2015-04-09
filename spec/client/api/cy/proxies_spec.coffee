describe "$Cypress.Cy Proxy Commands", ->
  enterCommandTestingMode()

  context "proxyies", ->
    fns = [
      {each: -> $(@).removeClass().addClass("foo")}
      {map: -> $(@).text()}
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

          it "ends immediately", ->
            @cy.get("#list")[name](arg).then ->
              expect(@log.get("end")).to.be.true
              expect(@log.get("state")).to.eq("success")

          it "snapshots immediately", ->
            @cy.get("#list")[name](arg).then ->
              expect(@log.get("snapshot")).to.be.an("object")

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
