getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  before ->
    Cypress.start()

  beforeEach ->
    Cypress.set(@currentTest)

    loadFixture("html/dom").done (iframe) =>
      Cypress.setup(runner, $(iframe), {}, ->)

  afterEach ->
    Cypress.abort()

  after ->
    Cypress.stop()

  context "#window", ->
    it "returns the remote window", ->
      cy.window().then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

  context "#document", ->
    it "returns the remote document as a jquery object", ->
      cy.document().then ($doc) ->
        expect($doc.get(0)).to.eq $("iframe").prop("contentDocument")

    it "aliases doc to document", ->
      cy.doc().then ($doc) ->
        expect($doc.get(0)).to.eq $("iframe").prop("contentDocument")

  context "#title", ->
    it "returns the pages title as a string", ->
      title = cy.$("title").text()
      cy.title().then (text) ->
        expect(text).to.eq title

    it "retries finding the title", ->
      cy.$("title").remove()

      _.delay ->
        cy.$("head").append $("<title>waiting on title</title>")
      , 500

      cy.title().then (text) ->
        expect(text).to.eq "waiting on title"

    it "retries until it has the correct title", ->
      cy.$("title").text("home page")

      _.delay ->
        cy.$("title").text("about page")
      , 500

      cy.title().wait (title) ->
        expect(title).to.eq "about page"

    it "throws after timing out", (done) ->
      @sandbox.stub cy.runner, "uncaught"
      @test.timeout(500)
      cy.$("title").remove()
      cy.title()
      cy.on "fail", (err) ->
        expect(err.message).to.include "Could not find element: title"
        done()

  context "#fill", ->
    it "requires an object literal", (done) ->
      @sandbox.stub cy.runner, "uncaught"

      cy.fill("")

      cy.on "fail", (err) ->
        expect(err.message).to.include "cy.fill() must be passed an object literal as its 1st argument!"
        done()

  context "#find", ->
    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(800)

    it "finds by selector", ->
      list = cy.$("#list")

      cy.find("#list").then ($list) ->
        expect($list).to.match list

    it "retries finding elements until something is found", ->
      missingEl = $("<div />", id: "missing-el")

      ## wait until we're ALMOST about to time out before
      ## appending the missingEl
      _.delay =>
        cy.$("body").append(missingEl)
      , @test.timeout() - 300

      cy.find("#missing-el").then ($div) ->
        expect($div).to.match missingEl

    it "retries until .wait resolves to true", ->
      _.delay =>
        cy.$("#list li").last().remove()
      , @test.timeout() - 300

      cy.find("#list li").wait ($list) ->
        expect($list.length).to.eq 2

    it "does not throw when could not find element and was told not to retry", ->
      cy.find("#missing-el", {retry: false}).then ($el) ->
        expect($el).not.to.exist

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws after timing out not finding element", (done) ->
        cy.find("#missing-el")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element: #missing-el"
          done()

  context "#contains", ->
    it "finds the nearest element by :contains selector", ->
      cy.contains("li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("li")

    it "has an optional filter argument", ->
      cy.contains("ul", "li 0").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("ul")

    it "can find input type=submits by value", ->
      cy.contains("input contains submit").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match "input[type=submit]"

    it "favors input type=submit", ->
      cy.contains("click me").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("input[type=submit]")

    it "favors buttons next", ->
      cy.contains("click button").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("button")

    it "favors anchors next", ->
      cy.contains("Home Page").then ($el) ->
        expect($el.length).to.eq(1)
        expect($el).to.match("a")

    it "retries until content is found", ->
      span = $("<span>brand new content</span>")

      _.delay ->
        cy.$("head").append span
      , 500

      cy.contains("brand new content").then ($span) ->
        expect($span).to.match span

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"
        @currentTest.timeout(500)

      it "throws any elements when timing out and no filter", (done) ->
        cy.contains("brand new content")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find any elements containing the content: brand new content"
          done()

      it "throws specific selector when timing out with a filter", (done) ->
        cy.contains("span", "brand new content")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find the selector: <span> containing the content: brand new content"
          done()

  context "#clear", ->
    it "does not change the subject", ->
      textarea = cy.$("textarea")

      cy.find("textarea").clear().then ($textarea) ->
        expect($textarea).to.match textarea

    it "removes the current value", ->
      textarea = cy.$("#comments")
      textarea.val("foo bar")

      ## make sure it really has that value first
      expect(textarea).to.have.value("foo bar")

      cy.find("#comments").clear().then ($textarea) ->
        expect($textarea).to.have.value("")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).clear()

        cy.on "fail", (err) -> done()

      it "throws if any subject isnt a textarea", (done) ->
        cy.find("textarea,form").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <form id=\"by-id\"></form>"
          done()

      it "throws if any subject isnt a :text", (done) ->
        cy.find("div").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <div id=\"dom\"></div>"
          done()

      it "throws on an input radio", (done) ->
        cy.find(":radio").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"radio\" name=\"gender\" value=\"male\">"
          done()

      it "throws on an input checkbox", (done) ->
        cy.find(":checkbox").clear()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".clear() can only be called on textarea or :text! Your subject contains a: <input type=\"checkbox\" name=\"colors\" value=\"blue\">"
          done()

  context "#check", ->
    it "does not change the subject", ->
      checkboxes = "[name=colors]"
      inputs = cy.$(checkboxes)
      cy.find(checkboxes).check().then ($inputs) ->
        expect($inputs).to.match(inputs)

    it "checks a checkbox", ->
      cy.find(":checkbox[name='colors'][value='blue']").check().then ($checkbox) ->
        expect($checkbox).to.be.checked

    it "checks a radio", ->
      cy.find(":radio[name='gender'][value='male']").check().then ($radio) ->
        expect($radio).to.be.checked

    it "is a noop if already checked", (done) ->
      checkbox = ":checkbox[name='colors'][value='blue']"
      cy.$(checkbox).prop("checked", true)
      cy.$(checkbox).change ->
        done("should not fire change event")
      cy.find(checkbox).check()
      cy.on "end", -> done()

    it "can check a collection", ->
      cy.find("[name=colors]").check().then ($inputs) ->
        $inputs.each (i, el) ->
          expect($(el)).to.be.checked

    it "can check a specific value from a collection", ->
      cy.find("[name=colors]").check("blue").then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 1
        expect($inputs.filter("[value=blue]")).to.be.checked

    it "can check multiple values from a collection", ->
      cy.find("[name=colors]").check(["blue", "green"]).then ($inputs) ->
        expect($inputs.filter(":checked").length).to.eq 2
        expect($inputs.filter("[value=blue],[value=green]")).to.be.checked

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when subject isnt dom", (done) ->
        cy.noop({}).check()

        cy.on "fail", (err) ->
          expect(err.message).to.include "Cannot use the modifier: .check()"
          done()

      it "throws when subject isnt a checkbox or radio", (done) ->
        ## this will find multiple forms
        cy.find("form").check()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <form id=\"by-id\"></form>"
          done()

      it "throws when any member of the subject isnt a checkbox or radio", (done) ->
        ## find a textare which should blow up
        ## the textarea is the last member of the subject
        cy.find(":checkbox,:radio,#comments").check()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".check() can only be called on :checkbox and :radio! Your subject contains a: <textarea id=\"comments\"></textarea>"
          done()

  context "#uncheck", ->
    it "unchecks a checkbox", ->
      cy.find("[name=birds][value=cockatoo]").uncheck().then ($checkbox) ->
        expect($checkbox).not.to.be.checked

    it "unchecks a checkbox by value", ->
      cy.find("[name=birds]").uncheck("cockatoo").then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 1
        expect($checkboxes.filter("[value=cockatoo]")).not.to.be.checked

    it "unchecks multiple checkboxes by values", ->
      cy.find("[name=birds]").uncheck(["cockatoo", "amazon"]).then ($checkboxes) ->
        expect($checkboxes.filter(":checked").length).to.eq 0
        expect($checkboxes.filter("[value=cockatoo],[value=amazon]")).not.to.be.checked

    it "is a noop if already unchecked", (done) ->
      checkbox = "[name=birds][value=cockatoo]"
      cy.$(checkbox).prop("checked", false).change ->
        done("should not fire change event")
      cy.find(checkbox).uncheck()
      cy.on "end", -> done()

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws specifically on a radio", (done) ->
        cy.find(":radio").uncheck()

        cy.on "fail", (err) ->
          expect(err.message).to.include ".uncheck() can only be called on :checkbox!"
          done()

      it "throws if not a checkbox", (done) ->
        cy.noop({}).uncheck()

        cy.on "fail", -> done()

  context "#click", ->
    it "sends a click event", (done) ->
      cy.$("#button").click -> done()

      cy.find("#button").click()

    it "returns the original subject", ->
      button = cy.$("#button")

      cy.find("#button").click().then ($button) ->
        expect($button).to.match button

    it "inserts artificial delay of 10ms", ->
      cy.on "invoke:start", (obj) =>
        if obj.name is "click"
          @delay = @sandbox.spy Promise.prototype, "delay"

      cy.find("#button").click().then ->
        expect(@delay).to.be.calledWith 10

    it "inserts artificial delay of 50ms for anchors", ->
      cy.on "invoke:start", (obj) =>
        if obj.name is "click"
          @delay = @sandbox.spy Promise.prototype, "delay"

      cy.contains("Home Page").click().then ->
        expect(@delay).to.be.calledWith 50

    it "can operate on a jquery collection", ->
      clicks = 0
      buttons = cy.$("button")
      buttons.click ->
        clicks += 1
        return false

      ## make sure we have more than 1 button
      expect(buttons.length).to.be.gt 1

      ## make sure each button received its click event
      cy.find("button").click().then ($buttons) ->
        expect($buttons.length).to.eq clicks

    it "can cancel multiple clicks", (done) ->
      clicks = 0

      spy = @sandbox.spy ->
        Cypress.abort()

      ## abort after the 3rd click
      clicked = _.after 3, spy

      anchors = cy.$("#sequential-clicks a")
      anchors.click ->
        clicks += 1
        clicked()

      ## make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte 5

      cy.on "cancel", ->
        _.delay ->
          ## abort should only have been called once
          expect(spy.callCount).to.eq 1

          ## and we should have stopped clicking after 3
          expect(clicks).to.eq 3
          done()
        , 200

      cy.find("#sequential-clicks a").click()

    it "serially clicks a collection", ->
      clicks = 0

      ## create a throttled click function
      ## which proves we are clicking serially
      throttled = _.throttle ->
        clicks += 1
      , 40, {leading: false}

      anchors = cy.$("#sequential-clicks a")
      anchors.click throttled

      ## make sure we're clicking multiple anchors
      expect(anchors.length).to.be.gt 1
      cy.find("#sequential-clicks a").click().then ($anchors) ->
        expect($anchors.length).to.eq clicks

    it "increases the timeout delta after each click", (done) ->
      prevTimeout = @test.timeout()

      count = cy.$("button").length

      cy.on "invoke:end", (obj) =>
        if obj.name is "click"
          expect(@test.timeout()).to.eq (count * 10) + prevTimeout
          done()

      cy.find("button").click()

    describe "errors", ->
      it "throws when not a dom subject", (done) ->
        @sandbox.stub cy.runner, "uncaught"

        cy.click()

        cy.on "fail", -> done()

  context "invoke", ->
    it "waits for isReady before invoking command", (done) ->
      ## when we are isReady false that means we should
      ## never begin invoking our commands
      cy.isReady(false)
      cy.noop()
      cy.on "invoke:start", -> done("should not trigger this")
      cy.on "set", ->
        ## we wait until we hear set because that means
        ## we've begun running our promise
        Cypress.abort().then -> done()

  context "#isReady", ->
    it "creates a deferred when not ready", ->
      cy.isReady(false)
      keys = _.keys cy.prop("ready")
      expect(keys).to.include("promise", "resolve", "reject")

    it "resolves the deferred when ready", (done) ->
      cy.isReady(false)
      cy.isReady(true)
      cy.on "ready", (bool) ->
        expect(cy.prop("ready").promise.isResolved()).to.be.true
        done()

  context "jquery proxy methods", ->
    fns = [
      {each: -> $(@).removeClass().addClass("foo")}
      {filter: ":first"}
      {map: -> $(@).text()}
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
          el = cy.$("#list")[name](arg)
          cy.find("#list")[name](arg).then ($el) ->
            expect($el).to.match el

        it "errors without a dom element", (done) ->
          @sandbox.stub cy.runner, "uncaught"

          cy.noop({})[name](arg)

          cy.on "fail", -> done()

  context "cancelling promises", ->
    it "cancels via a delay", (done) ->
      pending = Promise.pending()

      promise = Promise.delay(0).cancellable().then ->
        done("not cancelled")
      .caught Promise.CancellationError, (err) ->
        done()

      promise.cancel()

  context ".abort", ->
    it "fires cancel event when theres an outstanding command", (done) ->
      cy.wait(1000)
      cy.on "cancel", -> done()
      cy.on "set", ->
        Cypress.abort()

    it "doesnt fire cancel event when no commands left", (done) ->
      cy.noop()
      cy.on "cancel", -> done("should not cancel")
      cy.on "end", ->
        Cypress.abort().then -> done()

    it "aborts running commands in the middle of running", (done) ->
      cy.on "cancel", (obj) ->
        expect(obj.name).to.eq "then"
        done()

      cy.noop().wait(10).then ->
        ## simulate the abort action happening
        ## during this .then command
        Cypress.abort()

        ## imagine we are returning another promise
        ## in our then command
        Promise.delay(10).then ->
          done("should not reach here")

  context "promises", ->
    it "doesnt invoke .then on the cypress instance", (done) ->
      _then = @sandbox.spy cy, "then"
      cy.wait(1000)

      cy.on "set", ->
        Cypress.abort().then ->
          expect(_then).not.to.be.called
          done()

  context "command error bubbling", ->
    beforeEach ->
      @uncaught = @sandbox.stub(cy.runner, "uncaught")

    it "does not emit command:end when a command fails", (done) ->
      trigger = @sandbox.spy cy, "trigger"

      cy
        .then ->
          _.defer ->
            expect(trigger).not.to.be.calledWith("command:end")
            done()
          throw new Error("err")

    it "emits fail and passes up err", (done) ->
      err = null
      cy.then ->
        err = new Error("err")
        throw err

      cy.on "fail", (e) ->
        expect(e).to.eq err
        done()

    it "passes the full stack trace to mocha", (done) ->
      err = null
      cy.then ->
        err = new Error("err")
        throw err

      cy.on "fail", (e) =>
        expect(@uncaught).to.be.calledWith(err)
        done()

  context ".restore", ->
    it "removes bound events", ->
      cy.on "foo", ->
      cy.on "bar", ->
      Cypress.restore()
      expect(cy._events).to.be.undefined

  context "saved subjects", ->
    it "will resolve deferred arguments", ->
      df = $.Deferred()

      _.delay ->
        df.resolve("iphone")
      , 100

      cy.find("input").type(df).then ($input) ->
        expect($input).to.have.value("iphone")

    it "handles saving subjects", ->
      cy.noop({foo: "foo"}).save("foo").noop(cy.get("foo")).then (subject) ->
        expect(subject).to.deep.eq {foo: "foo"}

    it "resolves falsy arguments", ->
      cy.noop(0).save("zero").then ->
        expect(cy.get("zero")).to.eq 0

    it "returns a function when no alias was found", ->
      cy.noop().then ->
        expect(cy.get("something")).to.be.a("function")

  context "property registry", ->
    beforeEach ->
      Cypress.restore()

    it "is initially empty", ->
      expect(cy.props).to.deep.eq {}

    it "inserts into the props registry", ->
      cy.prop("foo", "bar")
      expect(cy.props).to.deep.eq {foo: "bar"}

    it "calls unregister during restory", ->
      unregister = @sandbox.spy(cy, "unregister")
      Cypress.restore()
      expect(unregister).to.have.been.called

    it "acts as a getter when no value is given", ->
      cy.prop("foo", "bar")
      expect(cy.prop("foo")).to.eq "bar"

    describe "falsy setter values", ->
      before ->
        @set = (key, val) ->
          cy.prop(key, val)
          expect(cy.prop(key)).to.eq val

      it "sets zero", ->
        @set "zero", 0

      it "sets null", ->
        @set "null", null

      it "sets empty string", ->
        @set "string", ""

    describe "sets each prop in the registry to null", ->
      beforeEach ->
        cy.prop("foo", "bar")
        cy.prop("baz", "quux")
        cy.unregister()

        ## need to return null here else mocha would insert a .then
        ## into the cypress instance
        return null

      it "resets the registry", ->
        expect(cy.props).to.deep.eq {}

      it "deletes registered properies", ->

        expect([cy.prop("foo"), cy.prop("baz")]).to.deep.eq [undefined, undefined]

  context "#_timeout", ->
    it "setter", ->
      cy._timeout(500)
      expect(@test.timeout()).to.eq 500

    it "setter returns cy instance", ->
      ret = cy._timeout(500)
      expect(ret).to.eq cy

    it "setter can increase by delta", ->
      currentTimeout = @test.timeout()
      cy._timeout(500, true)
      expect(@test.timeout()).to.eq 500 + currentTimeout

    it "getter returns integer", ->
      timeout = @test.timeout()
      expect(cy._timeout()).to.eq timeout

    it "throws error when no runnable", ->
      Cypress.restore()
      fn = ->
        cy._timeout(500)

      expect(fn).to.throw(Error)

  context "#wait", ->
    describe "number argument", ->
      it "passes delay onto Promise", ->
        delay = @sandbox.spy Promise, "delay"
        cy.wait(100)
        cy.on "invoke:end", ->
          expect(delay).to.be.calledWith 100

      it "does not change the subject", ->
        cy
          .find("input")
          .then ($input) ->
            @$input = $input
          .wait(10)

        cy.on "invoke:end", (obj) =>
          if obj.name is "wait"
            expect(cy.prop("subject")).to.eq @$input

      it "does not time out the runnable", ->
        timer = @sandbox.useFakeTimers("setTimeout")
        trigger = @sandbox.spy(cy, "trigger")
        cy._timeout(100)
        cy.wait()
        timer.tick()
        timer.tick(5000)
        expect(trigger).not.to.be.calledWith "invoke:end"

      describe "function argument", ->
        it "resolves when truthy", ->
          cy.wait ->
            "foo" is "foo"

        it "retries when false", (done) ->
          i = 0
          fn = ->
            i += 1
          fn = @sandbox.spy fn
          cy.then(fn).wait (i) ->
            console.log "retrying", i
            i is 3
          cy.on "end", ->
            expect(fn.callCount).to.eq 3
            done()

        it "retries when null", (done) ->
          i = 0
          fn = ->
            i += 1
          fn = @sandbox.spy fn
          cy.then(fn).wait (i) ->
            if i isnt 2 then null else true
          cy.on "end", ->
            expect(fn.callCount).to.eq 2
            done()

        it "retries when undefined", (done) ->
          i = 0
          fn = ->
            i += 1
          fn = @sandbox.spy fn
          cy.then(fn).wait (i) ->
            if i isnt 2 then undefined else true
          cy.on "end", ->
            expect(fn.callCount).to.eq 2
            done()

        it "resolves with existing subject", ->
          cy
            .find("input").then ($input) ->
              @$input = $input
            .wait(-> true)

          cy.on "invoke:end", (obj) =>
            if obj.name is "wait"
              expect(cy.prop("subject")).to.eq @$input

      describe "errors thrown", ->
        beforeEach ->
          @uncaught = @sandbox.stub(cy.runner, "uncaught")

        it "times out eventually due to false value", (done) ->
          ## forcibly reduce the timeout to 500 ms
          ## so we dont have to wait so long
          cy
            .noop()
            .wait (-> false), timeout: 500

          cy.on "fail", (err) ->
            expect(err.message).to.include "The final value was: false"
            done()

        it "appends to the err message", (done) ->
          cy
            .noop()
            .wait (-> expect(true).to.be.false), timeout: 500

          cy.on "fail", (err) ->
            expect(err.message).to.include "Timed out retrying. Could not continue due to: AssertionError"
            done()

  context "#_retry", ->
    it "returns a nested cancellable promise", (done) ->
      i = 0
      fn = ->
        i += 1
        console.log "iteration #", i

      fn = @sandbox.spy fn

      cy.then(fn).wait -> i is 3

      cy.on "retry", ->
        ## abort after the 1st retry
        ## which is the 2nd invocation of i
        ## which should prevent the 3rd invocation
        Cypress.abort() if i is 2

      cy.on "cancel", ->
        ## once from .then and once from .wait
        expect(fn.callCount).to.eq 2
        done()

    it "stores the runnables current timeout", ->
      prevTimeout = @test.timeout()
      options = {}
      fn = ->
      cy._retry(fn, options)
      expect(options.runnableTimeout).to.eq prevTimeout

    it "increases the runnables timeout exponentially", ->
      prevTimeout = @test.timeout()
      timeout = @sandbox.spy @test, "timeout"
      fn = ->
      cy._retry(fn, {})
      expect(timeout).to.be.calledWith 1e9
      expect(@test.timeout()).to.be.gt prevTimeout

  context "nested commands", ->
    beforeEach ->
      @setup = (fn = ->) =>
        Cypress.add "nested", ->
          cy.url()

        cy
          .inspect()
          .nested()
          .noop()
          .then -> fn()

    it "queues in the correct order", ->
      @setup ->
        expect(getNames(cy.queue)).to.deep.eq ["inspect", "nested", "url", "noop", "then", "then"]

    it "nested command should reference url as next property", ->
      @setup ->
        nested = _(cy.queue).find (obj) -> obj.name is "nested"
        expect(nested.next.name).to.eq "url"

    it "null outs nestedIndex prior to restoring", (done) ->
      @setup()
      cy.on "end", ->
        expect(cy.prop("nestedIndex")).to.be.null
        done()

    it "can recursively nest", ->
      Cypress.add "nest1", ->
        cy.nest2()

      Cypress.add "nest2", ->
        cy.noop()

      cy
        .inspect()
        .nest1()
        .then ->
          expect(getNames(cy.queue)).to.deep.eq ["inspect", "nest1", "nest2", "noop", "then", "then"]

    it "works with multiple nested commands", ->
      Cypress.add "multiple", ->
        cy
          .url()
          .location()
          .noop()

      cy
        .inspect()
        .multiple()
        .then ->
          expect(getNames(cy.queue)).to.deep.eq ["inspect", "multiple", "url", "location", "noop", "then", "then"]