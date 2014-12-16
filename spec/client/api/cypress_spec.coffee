getNames = (queue) ->
  _(queue).pluck("name")

describe "Cypress API", ->
  before ->
    Cypress.start()

    @loadDom = =>
      loadFixture("html/dom").done (iframe) =>
        @iframe = $(iframe)
        @head = @iframe.contents().find("head").children().prop("outerHTML")
        @body = @iframe.contents().find("body").children().prop("outerHTML")

    @loadDom()

  beforeEach ->
    @setup = =>
      @iframe.contents().find("head").html(@head)
      @iframe.contents().find("body").html(@body)

      Cypress.set(@currentTest)
      Cypress.setup(runner, @iframe, {}, ->)

    ## if we've changed the src by navigating
    ## away (aka cy.visit(...)) then we need
    ## to reload the fixture again and then setup
    if /dom/.test(@iframe.attr("src"))
      @setup()
    else
      @loadDom().then @setup

  afterEach ->
    Cypress.abort()

  after ->
    Cypress.stop()

  context "#findByRepeater", ->
    ngPrefixes = {"phone in phones": 'ng-', "phone2 in phones": 'ng_', "phone3 in phones": 'data-ng-', "phone4 in phones": 'x-ng-'}

    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(800)

    _.each ngPrefixes, (prefix, attr) ->
      it "finds by #{prefix}repeat", ->
        ## make sure we find this element
        li = cy.$("[#{prefix}repeat*='#{attr}']")
        expect(li).to.exist

        ## and make sure they are the same DOM element
        cy.ng("repeater", attr).then ($li) ->
          expect($li.get(0)).to.eq li.get(0)

    it "favors earlier items in the array when duplicates are found", ->
      li = cy.$("[ng-repeat*='foo in foos']")

      cy.ng("repeater", "foo in foos").then ($li) ->
        expect($li.get(0)).to.eq li.get(0)

    it "waits to find a missing input", ->
      missingLi = $("<li />", "data-ng-repeat": "li in lis")

      ## wait until we're ALMOST about to time out before
      ## appending the missingInput
      _.delay =>
        cy.$("body").append(missingLi)
        # debugger
      , @test.timeout() - 300

      cy.ng("repeater", "li in lis").then ($li) ->
        expect($li).to.match missingLi

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when repeater cannot be found", (done) ->
        cy.ng("repeater", "not-found")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element for repeater: 'not-found'.  Searched [ng-repeat*='not-found'], [ng_repeat*='not-found'], [data-ng-repeat*='not-found'], [x-ng-repeat*='not-found']."
          done()

      it "cancels additional finds when aborted", (done) ->
        _.delay ->
          Cypress.abort()
        , 200

        cy.ng("repeater", "not-found")

        cy.on "fail", (err) ->
          done(err)

        cy.on "cancel", =>
          retry = @sandbox.spy cy, "_retry"
          _.delay ->
            expect(retry.callCount).to.eq 0
            done()
          , 100

  context "#findByModel", ->
    ngPrefixes = {query: 'ng-', query2: 'ng_', query3: 'data-ng-', query4: 'x-ng-'}

    beforeEach ->
      ## make this test timeout quickly so
      ## we dont have to wait so damn long
      @currentTest.timeout(800)

    _.each ngPrefixes, (prefix, attr) ->
      it "finds element by #{prefix}model", ->
        ## make sure we find this element
        input = cy.$("[#{prefix}model=#{attr}]")
        expect(input).to.exist

        ## and make sure they are the same DOM element
        cy.ng("model", attr).then ($input) ->
          expect($input.get(0)).to.eq input.get(0)

    it "favors earlier items in the array when duplicates are found", ->
      input = cy.$("[ng-model=foo]")

      cy.ng("model", "foo").then ($input) ->
        expect($input.get(0)).to.eq input.get(0)

    it "waits to find a missing input", ->
      missingInput = $("<input />", "data-ng-model": "missing-input")

      ## wait until we're ALMOST about to time out before
      ## appending the missingInput
      _.delay =>
        cy.$("body").append(missingInput)
      , @test.timeout() - 300

      cy.ng("model", "missing-input").then ($input) ->
        expect($input).to.match missingInput

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when model cannot be found", (done) ->
        cy.ng("model", "not-found")

        cy.on "fail", (err) ->
          expect(err.message).to.include "Could not find element for model: 'not-found'.  Searched [ng-model='not-found'], [ng_model='not-found'], [data-ng-model='not-found'], [x-ng-model='not-found']."
          done()

      it "cancels additional finds when aborted", (done) ->
        _.delay ->
          Cypress.abort()
        , 200

        cy.ng("model", "not-found")

        cy.on "fail", (err) ->
          done(err)

        cy.on "cancel", =>
          retry = @sandbox.spy cy, "_retry"
          _.delay ->
            expect(retry.callCount).to.eq 0
            done()
          , 100

  context "#visit", ->
    it "returns a promise", ->
      promise = cy._action("visit", "/foo")
      expect(promise).to.be.instanceOf(Promise)

    it "triggers visit:start on the remote iframe", (done) ->
      $("iframe").on "visit:start", (e, url) ->
        expect(url).to.eq "/foo"
        done()

      cy.visit("/foo")

    it "resolves the subject to the remote iframe window", ->
      cy.visit("/foo").then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      cy.visit("/foo").then ->
        src = $("iframe").attr("src")
        expect(src).to.eq "/__remote/foo?__initial=true"

    it "immediately updates the stored href on load", (done) ->
      _storeHref = @sandbox.spy cy, "_storeHref"

      cy.on "invoke:subject", (subject, obj) ->
        expect(_storeHref.callCount).to.eq 2
        done()

      cy.visit("/foo")

    it "prevents _hrefChanged from always being true after visiting", (done) ->
      cy.on "invoke:subject", (subject, obj) ->
        expect(cy._hrefChanged()).to.be.false
        done()

      cy.visit("/foo")

    it "extends the runnables timeout before visit"

    it "resets the runnables timeout after visit"

    it "invokes onLoad callback"
    it "invokes onBeforeLoad callback"

  context "#eval", ->
    beforeEach ->
      @server = @sandbox.useFakeServer()
      @server.autoRespond = true
      @server.respondWith /eval/, JSON.stringify({foo: "bar"})

    it "changes the subject to the response", ->
      cy.eval("foo()").then (resp) ->
        expect(resp).to.deep.eq {foo: "bar"}

    it "updates the timeout?"

    it "retains the current xhr", ->
      cy.eval("foo()").then ->
        expect(cy.prop("xhr").responseText).to.eq @server.requests[0].responseText

    it "aborts any existing xhr?"

    it "removes the current xhr on success?"

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

  context "#select", ->
    it "does not change the subject", ->
      select = cy.$("select[name=maps]")

      cy.find("select[name=maps]").select("train").then ($select) ->
        expect($select).to.match select

    it "selects by value", ->
      cy.find("select[name=maps]").select("de_train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "selects by text", ->
      cy.find("select[name=maps]").select("train").then ($select) ->
        expect($select).to.have.value("de_train")

    it "prioritizes value over text", ->
      cy.find("select[name=foods]").select("Ramen").then ($select) ->
        expect($select).to.have.value("Ramen")

    it "can select an array of values", ->
      cy.find("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    it "can select an array of texts", ->
      cy.find("select[name=movies]").select(["The Human Condition", "There Will Be Blood"]).then ($select) ->
        expect($select.val()).to.deep.eq ["thc", "twbb"]

    it "clears previous values when providing an array", ->
      ## make sure we have a previous value
      select = cy.$("select[name=movies]").val(["2001"])
      expect(select.val()).to.deep.eq ["2001"]

      cy.find("select[name=movies]").select(["apoc", "br"]).then ($select) ->
        expect($select.val()).to.deep.eq ["apoc", "br"]

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).select("foo")

        cy.on "fail", -> done()

      it "throws when more than 1 element in the collection", (done) ->
        cy
          .find("select").then ($selects) ->
            @num = $selects.length
            return $selects
          .select("foo")

        cy.on "fail", (err) =>
          expect(err.message).to.include ".select() can only be called on a single <select>! Your subject contained #{@num} elements!"
          done()

      it "throws on anything other than a select", (done) ->
        cy.find("input:first").select("foo")

        cy.on "fail", (err) ->
          expect(err.message).to.include ".select() can only be called on a <select>! Your subject is a: <input id=\"input\">"
          done()

      it "throws when finding duplicate values", (done) ->
        cy.find("select[name=names]").select("bm")

        cy.on "fail", (err) ->
          expect(err.message).to.include ".select() matched than one option by value or text: bm"
          done()

      it "throws when passing an array to a non multiple select", (done) ->
        cy.find("select[name=names]").select(["bm", "ss"])

        cy.on "fail", (err) ->
          expect(err.message).to.include ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"
          done()

  context "#type", ->
    it "does not change the subject", ->
      input = cy.$("input:first")

      cy.find("input:first").type("foo").then ($input) ->
        expect($input).to.match input

    it "changes the value", ->
      input = cy.$("input:text:first")

      input.val("")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("")

      cy.find("input:text:first").type("foo").then ($input) ->
        expect($input).to.have.value("foo")

    it "appends to a current value", ->
      input = cy.$("input:text:first")

      input.val("foo")

      ## make sure we are starting from a
      ## clean state
      expect(input).to.have.value("foo")

      cy.find("input:text:first").type(" bar").then ($input) ->
        expect($input).to.have.value("foo bar")

    describe "errors", ->
      beforeEach ->
        @sandbox.stub cy.runner, "uncaught"

      it "throws when not a dom subject", (done) ->
        cy.noop({}).type("foo")

        cy.on "fail", -> done()

      it "throws when not textarea or :text", (done) ->
        cy.find("form").type("foo")

        cy.on "fail", (err) ->
          expect(err.message).to.include ".type() can only be called on textarea or :text! Your subject is a: <form id=\"by-id\"></form>"
          done()

      it "throws when subject is a collection of elements", (done) ->
        cy
          .find("textarea,:text").then ($inputs) ->
            @num = $inputs.length
            return $inputs
          .type("foo")

        cy.on "fail", (err) =>
          expect(err.message).to.include ".type() can only be called on a single textarea or :text! Your subject contained #{@num} elements!"
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

    it "updates the stored href", ->
      cy
        .noop({}).then ->
          expect(cy.prop("href")).to.eq "/fixtures/html/dom.html"
        .visit("/foo").then ->
          expect(cy.prop("href")).to.eq "foo"

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

    it "prevents a bug creating an additional .then promise", (done) ->
      cy.isReady(false)
      cy.isReady(true)

      cy.on "end", ->
        expect(cy.queue.length).to.eq(1)
        done()

      cy.noop({})

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

  context "#_storeHref", ->
    it "sets prop href", ->
      cy._storeHref()
      expect(cy.prop("href")).to.eq "/fixtures/html/dom.html"

    it "strips the hash from the href", ->
      @sandbox.stub(cy, "_location").returns
        href: "/foo/bar#baz/quux"
        hash: "#baz/quux"

      cy._storeHref()
      expect(cy.prop("href")).to.eq "/foo/bar"

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

      cy.find("input:text:first").type(df).then ($input) ->
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