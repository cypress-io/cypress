describe "$Cypress.Cy Querying Commands", ->
  enterCommandTestingMode()

  context "#within", ->
    it "scopes additional GET finders to the subject", ->
      input = @cy.$("#by-name input:first")

      @cy.get("#by-name").within ->
        @cy.get("input:first").then ($input) ->
          expect($input.get(0)).to.eq input.get(0)

    it "scopes additional CONTAINS finders to the subject", ->
      span = @cy.$("#nested-div span:contains(foo)")

      @cy.contains("foo").then ($span) ->
        expect($span.get(0)).not.to.eq span.get(0)

      @cy.get("#nested-div").within ->
        @cy.contains("foo").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    it "does not change the subject", ->
      form = @cy.$("#by-name")

      @cy.get("#by-name").within(->).then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "can call child commands after within on the same subject", ->
      input = @cy.$("#by-name input:first")

      @cy.get("#by-name").within(->).find("input:first").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "supports nested withins", ->
      span = @cy.$("#button-text button span")

      @cy.get("#button-text").within ->
        @cy.get("button").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

    it "supports complicated nested withins", ->
      span1 = @cy.$("#button-text a span")
      span2 = @cy.$("#button-text button span")

      @cy.get("#button-text").within ->
        @cy.get("a").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span1.get(0)

        @cy.get("button").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span2.get(0)

    it "clears withinSubject after within is over", ->
      input = @cy.$("input:first")
      span = @cy.$("#button-text button span")

      @cy.get("#button-text").within ->
        @cy.get("button").within ->
          @cy.get("span").then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

      @cy.get("input:first").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "removes command:start listeners after within is over", ->
      @cy.get("#button-text").within ->
        @cy.get("button").within ->
          @cy.get("span")

      @cy.then ->
        expect(@cy._events).not.to.have.property "command:start"

    it "clears withinSubject even if next is null", (done) ->
      span = @cy.$("#button-text button span")

      @cy.on "end", ->
        ## should be defined here because next would have been
        ## null and withinSubject would not have been cleared
        expect(@prop("withinSubject")).not.to.be.undefined

        _.defer =>
          expect(@prop("withinSubject")).to.be.null
          done()

      @cy.get("#button-text").within ->
        @cy.get("button span").then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        div = @cy.$("div:first")

        @Cypress.on "log", (log) ->
          if log.get("name") is "within"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            expect(log.get("$el").get(0)).to.eq div.get(0)
            done()

        @cy.get("div:first").within ->

      it "snapshots after clicking", ->
        @cy.get("div:first").within ->
          @cy.then ->
            expect(@log.get("snapshot")).to.be.an("object")

      it "logs out deltaOptions with message", ->
        button = @cy.$("#button").hide()

        @cy.get("#button", {visible: false}).then ($el) ->
          expect(@log.get("message")).to.eq "#button, {visible: false}"

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once when not dom subject", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs).to.have.length(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.noop().within ->

      it "throws when not a DOM subject", (done) ->
        @cy.on "fail", (err) -> done()

        @cy.noop().within ->

      _.each ["", [], {}, 1, null, undefined], (value) =>
        it "throws if passed anything other than a function, such as: #{value}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.include "cy.within() must be called with a function!"
            done()

          @cy.get("body").within(value)

  context "#root", ->
    it "returns html", ->
      html = @cy.$("html")

      @cy.root().then ($html) ->
        expect($html.get(0)).to.eq html.get(0)

    it "returns withinSubject if exists", ->
      form = @cy.$("form")

      @cy.get("form").within ->
        @cy
          .get("input")
          .root().then ($root) ->
            expect($root.get(0)).to.eq form.get(0)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (log) ->
          if log.get("name") is "root"
            expect(log.get("state")).to.eq("pending")
            expect(log.get("message")).to.eq("")
            done()

        @cy.root()

      it "snapshots after clicking", ->
        @Cypress.on "log", (@log) =>

        @cy.root().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "sets $el to document", ->
        html = @cy.$("html")

        @cy.root().then ->
          expect(@log.get("$el").get(0)).to.eq(html.get(0))

      it "sets $el to withinSubject", ->
        form = @cy.$("form")

        @cy.get("form").within ->
          @cy
            .get("input")
            .root().then ($root) ->
              expect(@log.get("$el").get(0)).to.eq(form.get(0))

  context "#get", ->
    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(300)

    it "finds by selector", ->
      list = @cy.$("#list")

      @cy.get("#list").then ($list) ->
        expect($list).to.match list

    it "retries finding elements until something is found", ->
      missingEl = $("<div />", id: "missing-el")

      ## wait until we're ALMOST about to time out before
      ## appending the missingEl
      @cy.on "retry", (options) =>
        if options.total + (options.interval * 4) > options.timeout
          @cy.$("body").append(missingEl)

      @cy.get("#missing-el").then ($div) ->
        expect($div).to.match missingEl

    it "retries until .until resolves to true", ->
      retry = _.after 3, =>
        @cy.$("#list li").last().remove()

      @cy.on "retry", retry

      @cy.get("#list li").until ($list) ->
        expect($list.length).to.eq 2

    it "does not throw when could not find element and was told not to retry", ->
      @cy.get("#missing-el", {retry: false}).then ($el) ->
        expect($el).not.to.exist

    _.each ["exist", "exists"], (key) ->
      describe "{#{key}: false}", ->
        it "returns null when cannot find element", ->
          options = {}
          options[key] = false
          @cy.get("#missing-el", options).then ($el) ->
            expect($el).to.be.null

        it "retries until cannot find element", ->
          ## add 500ms to the delta
          @cy._timeout(500, true)

          retry = _.after 3, =>
            @cy.$("#list li:last").remove()

          @cy.on "retry", retry

          options = {}
          options[key] = false
          @cy.get("#list li:last", options).then ($el) ->
            expect($el).to.be.null

    describe "{visible: null}", ->
      it "finds invisible elements by default", ->
        button = @cy.$("#button").hide()

        @cy.get("#button").then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "{visible: false}", ->
      it "returns invisible element", ->
        button = @cy.$("#button").hide()

        @cy.get("#button", {visible: false}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

      it "retries until element is invisible", ->
        ## add 500ms to the delta
        @cy._timeout(500, true)

        button = null

        retry = _.after 3, =>
          button = @cy.$("#button").hide()

        @cy.on "retry", retry

        @cy.get("#button", {visible: false}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe "{visible: true}", ->
      it "returns visible element", ->
        button = @cy.$("#button")

        @cy.get("#button", {visible: true}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

      it "retries until element is visible", ->
        ## add 500ms to the delta
        @cy._timeout(500, true)

        button = @cy.$("#button").hide()

        retry = _.after 3, =>
          button.show()

        @cy.on "retry", retry

        @cy.get("#button", {visible: true}).then ($button) ->
          expect($button.get(0)).to.eq button.get(0)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (log) ->
          expect(log.pick("state", "referencesAlias", "aliasType")).to.deep.eq {
            state: "pending"
            referencesAlias: undefined
            aliasType: "dom"
          }
          done()

        @cy.get("body")

      it "logs obj once complete", ->
        @cy.get("body").as("b").then ($body) ->
          obj = {
            state: "success"
            name: "get"
            message: "body"
            alias: "b"
            aliasType: "dom"
            referencesAlias: undefined
            $el: $body
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "#onConsole", ->
        @cy.get("body").then ($body) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "get"
            Selector: "body"
            Options: undefined
            Returned: $body
            Elements: 1
          }

      it "#onConsole with an alias", ->
        @cy.get("body").as("b").get("@b").then ($body) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "get"
            Alias: "@b"
            Options: undefined
            Returned: $body
            Elements: 1
          }

    describe "alias references", ->
      it "re-queries for an existing alias", ->
        body = @cy.$("body")

        @cy.get("body").as("b").get("@b").then ($body) ->
          expect($body.get(0)).to.eq body.get(0)

      it "re-queries the dom if any element in an alias isnt in the document", ->
        inputs = @cy.$("input")

        @cy
          .get("input").as("inputs").then ($inputs) ->
            @length = $inputs.length

            ## remove the last input
            $inputs.last().remove()

            ## return original subject
            return $inputs
          .get("@inputs").then ($inputs) ->
            ## we should have re-queried for these inputs
            ## which should have reduced their length by 1
            expect($inputs).to.have.length(@length - 1)

      # it "re-queries the dom if any element in an alias isnt visible", ->
      #   inputs = @cy.$("input")
      #   inputs.hide()

      #   cy
      #     .get("input", {visible: false}).as("inputs").then ($inputs) ->
      #       @length = $inputs.length

      #       ## show the inputs
      #       $inputs.show()

      #       return $inputs
      #     .get("@inputs").then ($inputs) ->
      #       ## we should have re-queried for these inputs
      #       ## which should have increased their length by 1
      #       expect($inputs).to.have.length(@length)

      ## these other tests are for .save
      # it "will resolve deferred arguments", ->
      #   df = $.Deferred()

      #   _.delay ->
      #     df.resolve("iphone")
      #   , 100

      #   @cy.get("input:text:first").type(df).then ($input) ->
      #     expect($input).to.have.value("iphone")

      # it "handles saving subjects", ->
      #   @cy.noop({foo: "foo"}).assign("foo").noop(@cy.get("foo")).then (subject) ->
      #     expect(subject).to.deep.eq {foo: "foo"}

      # it "resolves falsy arguments", ->
      #   @cy.noop(0).assign("zero").then ->
      #     expect(@cy.get("zero")).to.eq 0

      # it "returns a function when no alias was found", ->
      #   @cy.noop().then ->
      #     expect(@cy.get("something")).to.be.a("function")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws after timing out not finding element", (done) ->
        @cy.get("#missing-el")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element: #missing-el"
          done()

      it "throws when using an alias that does not exist"

      it "throws after timing out after a .wait() alias reference", (done) ->
        @cy.$("#get-json").click =>
          @cy._timeout(1000)

          retry = _.after 3, _.once =>
            @cy.sync.window().$.getJSON("/json")

          @cy.on "retry", retry

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element: getJsonButton"
          done()

        @cy
          .server()
          .route(/json/, {foo: "foo"}).as("getJSON")
          .get("#get-json").as("getJsonButton").click()
          .wait("@getJSON")
          .get("getJsonButton")

      it "throws after timing out while not trying to find an element", (done) ->
        @cy.get("div:first", {exist: false})

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Found existing element: div:first"
          done()

      it "throws after timing out while trying to find an invisible element", (done) ->
        @cy.get("div:first", {visible: false})

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Found visible element: div:first"
          done()

      it "throws after timing out trying to find a visible element", (done) ->
        @cy.$("#button").hide()

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find visible element: #button"
          done()

        @cy.get("#button", {visible: true})

      it "sets error command state", (done) ->
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "error"
          expect(@log.get("error")).to.eq err
          done()

        @cy.get("foobar")

  context "#contains", ->
    it "finds the nearest element by :contains selector", ->
      @cy.contains("li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("li")

    it "resets the subject between chain invocations", ->
      span = @cy.$(".k-in:contains(Quality Control):last")
      label = @cy.$("#complex-contains label")

      @cy.get("#complex-contains").contains("nested contains").then ($label) ->
        expect($label.get(0)).to.eq label.get(0)
        return $label
      @cy.contains("Quality Control").then ($span) ->
        expect($span.get(0)).to.eq span.get(0)

    it "GET is scoped to the current subject", ->
      span = @cy.$("#click-me a span")

      @cy.get("#click-me a").contains("click").then ($span) ->
        expect($span.length).to.eq(1)
        expect($span.get(0)).to.eq span.get(0)

    it "can find input type=submits by value", ->
      @cy.contains("input contains submit").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match "input[type=submit]"

    it "has an optional filter argument", ->
      @cy.contains("ul", "li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("ul")

    it "disregards priority elements when provided a filter", ->
      form = @cy.$("#click-me")

      @cy.contains("form", "click me").then ($form) ->
        expect($form.get(0)).to.eq form.get(0)

    it "favors input type=submit", ->
      @cy.contains("click me").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("input[type=submit]")

    it "favors buttons next", ->
      @cy.contains("click button").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("button")

    it "favors anchors next", ->
      @cy.contains("Home Page").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("a")

    it "reduces right by priority element", ->
      label = @cy.$("#complex-contains label")

      ## it should find label because label is the first priority element
      ## out of the collection of contains elements
      @cy.get("#complex-contains").contains("nested contains").then ($label) ->
        expect($label.get(0)).to.eq label.get(0)

    it "retries until content is found", ->
      span = $("<span>brand new content</span>")

      ## only append the span after we retry
      ## three times
      retry = _.after 3, =>
        @cy.$("body").append span

      @cy.on "retry", retry

      @cy.contains("brand new content").then ($span) ->
        expect($span.get(0)).to.eq span.get(0)

    it "finds the furthest descendent when filter matches more than 1 element", ->
      @cy
        .get("#contains-multiple-filter-match").contains("li", "Maintenance").then ($row) ->
          expect($row).to.have.class("active")

    describe "{exist: false}", ->
      it "returns null when no content exists", ->
        @cy.contains("alksjdflkasjdflkajsdf", {exist: false}).then ($el) ->
          expect($el).to.be.null

    describe "{visible: false}", ->
      it "returns invisible element", ->
        span = @cy.$("#not-hidden").hide()

        @cy.contains("span", "my hidden content", {visible: false}).then ($span) ->
          expect($span.get(0)).to.eq span.get(0)

    describe "subject contains text nodes", ->
      it "searches for content within subject", ->
        badge = @cy.$("#edge-case-contains .badge:contains(5)")

        @cy.get("#edge-case-contains").find(".badge").contains(5).then ($badge) ->
          expect($badge.get(0)).to.eq badge.get(0)

      it "returns the first element when subject contains multiple elements", ->
        badge = @cy.$("#edge-case-contains .badge-multi:contains(1)")

        @cy.get("#edge-case-contains").find(".badge-multi").contains(1).then ($badge) ->
          expect($badge.length).to.eq(1)
          expect($badge.get(0)).to.eq badge.get(0)

      it "returns the subject when it has a text node of matching content", ->
        count = @cy.$("#edge-case-contains .count:contains(2)")

        @cy.get("#edge-case-contains").find(".count").contains(2).then ($count) ->
          expect($count.length).to.eq(1)
          expect($count.get(0)).to.eq count.get(0)

      it "retries until it finds the subject has the matching text node", (done) ->
        count = $("<span class='count'>100</span>")

        ## make sure it retries 3 times!
        retry = _.after 3, =>
          @cy.$("#edge-case-contains").append(count)

          @cy.chain().then ($count) ->
            expect($count.length).to.eq(1)
            expect($count.get(0)).to.eq count.get(0)
            done()

        @cy.on "retry", retry

        @cy.get("#edge-case-contains").contains(100)

      it "retries until it finds a filtered contains has the matching text node", (done) ->
        count = $("<span class='count'>100</span>")

        retry = _.after 3, =>
          @cy.$("#edge-case-contains").append(count)

          @cy.chain().then ($count) ->
            expect($count.length).to.eq(1)
            expect($count.get(0)).to.eq count.get(0)
            done()

        @cy.on "retry", retry

        @cy.get("#edge-case-contains").contains(".count", 100)

      it "returns the first matched element when multiple match and there is no filter", ->
        icon = @cy.$("#edge-case-contains i:contains(25)")

        @cy.get("#edge-case-contains").contains(25).then ($icon) ->
          expect($icon.length).to.eq(1)
          expect($icon.get(0)).to.eq icon.get(0)

    describe "special characters", ->
      _.each "' \" [ ] { } ! @ # $ % ^ & * ( ) , ; :".split(" "), (char) ->
        it "finds content with character: #{char}", ->
          span = $("<span>special char #{char} content</span>").appendTo @cy.$("body")

          @cy.contains("span", char).then ($span) ->
            expect($span.get(0)).to.eq span.get(0)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (log) ->
          if log.get("name") is "contains"
            expect(log.pick("state", "type")).to.deep.eq {
              state: "pending"
              type: "child"
            }
            done()

        @cy.get("body").contains("foo")

      it "snapshots after finding element", ->
        @Cypress.on "log", (@log) =>

        @cy.contains("foo").then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "silences internal @cy.get() log", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        ## GOOD: [ {name: get} , {name: contains} ]
        ## BAD:  [ {name: get} , {name: get} , {name: contains} ]
        @cy.get("#complex-contains").contains("nested contains").then ($label) ->
          names = _(logs).map (log) -> log.get("name")
          expect(logs).to.have.length(2)
          expect(names).to.deep.eq ["get", "contains"]

      it "passes in $el", ->
        @cy.get("#complex-contains").contains("nested contains").then ($label) ->
          expect(@log.get("$el")).to.eq $label

      it "sets type to parent when used as a parent command", ->
        @cy.contains("foo").then ->
          expect(@log.get("type")).to.eq "parent"

      it "sets type to parent when subject doesnt have an element", ->
        @cy.noop({}).contains("foo").then ->
          expect(@log.get("type")).to.eq "parent"

      it "sets type to child when used as a child command", ->
        @cy.get("body").contains("foo").then ->
          expect(@log.get("type")).to.eq "child"

      it "#onConsole", ->
        @cy.get("#complex-contains").contains("nested contains").then ($label) ->
          expect(@log.attributes.onConsole()).to.deep.eq {
            Command: "contains"
            Content: "nested contains"
            "Applied To": getFirstSubjectByName.call(@, "get")
            Returned: $label
            Elements: 1

          }

    describe "errors", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(300)

      _.each [undefined, null], (val) ->
        it "throws when text is #{val}", (done) ->
          @cy.on "fail", (err) ->
            expect(err.message).to.eq("cy.contains() can only accept a string or number!")
            done()

          @cy.contains(val)

      it "throws on a blank string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.contains() cannot be passed an empty string!"
          done()

        @cy.contains("")

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs).to.have.length(1)
          done()

        @cy.contains(undefined)

      it "throws when there is a filter", (done) ->
        @cy.contains("span", "brand new content")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: 'brand new content' within the selector: 'span'"
          done()

      it "throws when there is no filter and no subject", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: 'brand new content' in any elements"
          done()

        @cy.contains("brand new content")

      it "throws when there is no filter but there is a subject", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: '0' within the element: <div.badge>"
          done()

        @cy.get("#edge-case-contains").find(".badge").contains(0)

      it "throws when there is a no filter but there is a multi subject", (done) ->
        @cy.contains("brand new content")

        @cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any content: 'brand new content' in any elements"
          done()

      it "throws after timing out while not trying to find an element that contains content", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Found content: 'button' within any existing elements"
          done()

        @cy.contains("button", {exist:false})
