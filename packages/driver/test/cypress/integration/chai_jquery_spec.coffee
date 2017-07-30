$ = Cypress.$

describe "jquery assertions", ->
  beforeEach ->
    @logs = []

    cy.on "log:added", (attrs, log) =>
      @logs.push(log)

    return null

  context "data", ->
    beforeEach ->
      @$div = $("<div data-foo='bar' />")
      @$div.data = -> throw new Error("data called")

    it "no prop, with prop, negation, and chainable", ->
      expect(@$div).to.have.data("foo") ## 1
      expect(@$div).to.have.data("foo", "bar") ## 2,3
      expect(@$div).to.have.data("foo").and.eq("bar") ## 4,5
      expect(@$div).to.have.data("foo").and.match(/bar/) ## 6,7
      expect(@$div).not.to.have.data("baz") ## 8

      expect(@logs.length).to.eq(8)

  context "class", ->
    beforeEach ->
      @$div = $("<div class='foo bar' />")
      @$div.hasClass = -> throw new Error("hasClass called")

    it "class, not class", ->
      expect(@$div).to.have.class("foo") ## 1
      expect(@$div).to.have.class("bar") ## 2
      expect(@$div).not.to.have.class("baz") ## 3

      expect(@logs.length).to.eq(3)

      l1 = @logs[0]
      l3 = @logs[2]

      expect(l1.get("message")).to.eq(
        "expected **<div.foo.bar>** to have class **foo**"
      )

      expect(l3.get("message")).to.eq(
        "expected **<div.foo.bar>** not to have class **baz**"
      )

  context "id", ->
    beforeEach ->
      @$div = $("<div id='foo' />")
      @$div.prop = -> debugger;throw new Error("prop called")
      @$div.attr = -> throw new Error("attr called")

      @$div2 = $("<div />")
      @$div2.prop("id", "foo")
      @$div2.prop = -> throw new Error("prop called")
      @$div2.attr = -> throw new Error("attr called")

      @$div3 = $("<div />")
      @$div3.attr("id", "foo")
      @$div3.prop = -> throw new Error("prop called")
      @$div3.attr = -> throw new Error("attr called")

    it "id, not id", ->
      expect(@$div).to.have.id("foo") ## 1
      expect(@$div).not.to.have.id("bar") ## 2

      expect(@$div2).to.have.id("foo") ## 3

      expect(@$div3).to.have.id("foo") ## 4

      expect(@logs.length).to.eq(4)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<div#foo>** to have id **foo**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div#foo>** not to have id **bar**"
      )

  context "html", ->
    beforeEach ->
      @$div = $("<div><button>button</button></div>")
      @$div.html = -> throw new Error("html called")

    it "html, not html", ->
      expect(@$div).to.have.html("<button>button</button>") ## 1
      expect(@$div).not.to.have.html("foo") ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to have HTML **<button>button</button>**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to have HTML **foo**"
      )

      try
        expect(@$div).to.have.html("<span>span</span>")
      catch err
        l6 = @logs[5]

        expect(l6.get("message")).to.eq(
          "expected **<div>** to have HTML **<span>span</span>**, but the HTML was **<button>button</button>**"
        )

  context "text", ->
    beforeEach ->
      @$div = $("<div>foo</div>")
      @$div.text = -> throw new Error("text called")

    it "text, not text", ->
      expect(@$div).to.have.text("foo") ## 1
      expect(@$div).not.to.have.text("bar") ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to have text **foo**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to have text **bar**"
      )

      try
        expect(@$div).to.have.text("bar")
      catch err
        l6 = @logs[5]

        expect(l6.get("message")).to.eq(
          "expected **<div>** to have text **bar**, but the text was **foo**"
        )

  context "value", ->
    beforeEach ->
      @$input = $("<input value='foo' />")
      @$input.val = -> throw new Error("val called")

    it "value, not value", ->
      expect(@$input).to.have.value("foo") ## 1
      expect(@$input).not.to.have.value("bar") ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<input>** to have value **foo**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<input>** not to have value **bar**"
      )

      try
        expect(@$input).to.have.value("bar")
      catch err
        l6 = @logs[5]

        expect(l6.get("message")).to.eq(
          "expected **<input>** to have value **bar**, but the value was **foo**"
        )

  context "descendents", ->
    beforeEach ->
      @$div = $("<div><button>button</button></div>")
      @$div.has = -> throw new Error("has called")

    it "descendents, not descendents", ->
      expect(@$div).to.have.descendents("button") ## 1
      expect(@$div).not.to.have.descendents("input") ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to have descendents **button**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to have descendents **input**"
      )

  context "visible", ->
    beforeEach ->
      @$div = $("<div>div</div>").appendTo($("body"))
      @$div.is = -> throw new Error("is called")

      @$div2 = $("<div style='display: none'>div</div>").appendTo($("body"))
      @$div2.is = -> throw new Error("is called")

    afterEach ->
      @$div.remove()
      @$div2.remove()

    it "visible, not visible, adds to error", ->
      expect(@$div).to.be.visible ## 1
      expect(@$div2).not.to.be.visible ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to be **visible**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to be **visible**"
      )

      try
        expect(@$div2).to.be.visible
      catch err
        l6 = @logs[5]

        ## the error on this log should have this message appended to it
        expect(l6.get("error").message).to.eq(
          """
          expected '<div>' to be 'visible'

          This element '<div>' is not visible because it has CSS property: 'display: none'
          """
        )

  context "hidden", ->
    beforeEach ->
      @$div = $("<div style='display: none'>div</div>").appendTo($("body"))
      @$div.is = -> throw new Error("is called")

      @$div2 = $("<div>div</div>").appendTo($("body"))
      @$div2.is = -> throw new Error("is called")

    afterEach ->
      @$div.remove()
      @$div2.remove()

    it "hidden, not hidden, adds to error", ->
      expect(@$div).to.be.hidden ## 1
      expect(@$div2).not.to.be.hidden ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to be **hidden**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to be **hidden**"
      )

      try
        expect(@$div2).to.be.hidden
      catch err
        l6 = @logs[5]

        ## the error on this log should have this message appended to it
        expect(l6.get("error").message).to.eq("expected '<div>' to be 'hidden'")

  context "selected", ->
    beforeEach ->
      @$option = $("<option selected>option</option>")
      @$option.is = -> throw new Error("is called")

      @$option2 = $("<option>option</option>")
      @$option2.is = -> throw new Error("is called")

    it "selected, not selected", ->
      expect(@$option).to.be.selected ## 1
      expect(@$option2).not.to.be.selected ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<option>** to be **selected**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<option>** not to be **selected**"
      )

  context "checked", ->
    beforeEach ->
      @$input = $("<input type='checkbox' checked />")
      @$input.is = -> throw new Error("is called")

      @$input2 = $("<input type='checkbox' />")
      @$input2.is = -> throw new Error("is called")

    it "checked, not checked", ->
      expect(@$input).to.be.checked ## 1
      expect(@$input2).not.to.be.checked ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<input>** to be **checked**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<input>** not to be **checked**"
      )

  context "enabled", ->
    beforeEach ->
      @$input = $("<input />")
      @$input.is = -> throw new Error("is called")

      @$input2 = $("<input disabled />")
      @$input2.is = -> throw new Error("is called")

    it "enabled, not enabled", ->
      expect(@$input).to.be.enabled ## 1
      expect(@$input2).not.to.be.enabled ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<input>** to be **enabled**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<input>** not to be **enabled**"
      )

  context "disabled", ->
    beforeEach ->
      @$input = $("<input disabled />")
      @$input.is = -> throw new Error("is called")

      @$input2 = $("<input />")
      @$input2.is = -> throw new Error("is called")

    it "disabled, not disabled", ->
      expect(@$input).to.be.disabled ## 1
      expect(@$input2).not.to.be.disabled ## 2

      expect(@logs.length).to.eq(2)

      l1 = @logs[0]
      l2 = @logs[1]

      expect(l1.get("message")).to.eq(
        "expected **<input>** to be **disabled**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<input>** not to be **disabled**"
      )

  context "exist", ->
    it "passes thru non DOM", ->
      expect([]).to.exist
      expect({}).to.exist
      expect('foo').to.exist

      expect(@logs.length).to.eq(3)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]

      expect(l1.get("message")).to.eq(
        "expected **[]** to exist"
      )

      expect(l2.get("message")).to.eq(
        "expected **{}** to exist"
      )

      expect(l3.get("message")).to.eq(
        "expected **foo** to exist"
      )

  context "empty", ->
    beforeEach ->
      @div = $("<div></div>")
      @div.is = -> throw new Error("is called")

      @div2 = $("<div><button>button</button></div>")
      @div2.is = -> throw new Error("is called")

    it "passes thru non DOM", ->
      expect([]).to.be.empty
      expect({}).to.be.empty
      expect('').to.be.empty

      expect(@logs.length).to.eq(3)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]

      expect(l1.get("message")).to.eq(
        "expected **[]** to be empty"
      )

      expect(l2.get("message")).to.eq(
        "expected **{}** to be empty"
      )

      expect(l3.get("message")).to.eq(
        "expected **''** to be empty"
      )

    it "empty, not empty, raw dom documents", ->
      expect(@div).to.be.empty ## 1
      expect(@div2).not.to.be.empty ## 2

      expect(@div.get(0)).to.be.empty ## 3
      expect(@div2.get(0)).not.to.be.empty ## 4

      expect(@logs.length).to.eq(4)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]
      l4 = @logs[3]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to be **empty**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to be **empty**"
      )

      expect(l3.get("message")).to.eq(
        "expected **<div>** to be **empty**"
      )

      expect(l4.get("message")).to.eq(
        "expected **<div>** not to be **empty**"
      )

  context "match", ->
    beforeEach ->
      @div = $("<div></div>")
      @div.is = -> throw new Error("is called")

    it "passes thru non DOM", ->
      expect('foo').to.match(/f/)

      expect(@logs.length).to.eq(1)

      l1 = @logs[0]

      expect(l1.get("message")).to.eq(
        "expected **foo** to match /f/"
      )

    it "match, not match, raw dom documents", ->
      expect(@div).to.match("div") ## 1
      expect(@div).not.to.match("button") ## 2

      expect(@div.get(0)).to.match("div") ## 3
      expect(@div.get(0)).not.to.match("button") ## 4

      expect(@logs.length).to.eq(4)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]
      l4 = @logs[3]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to match **div**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** not to match **button**"
      )

      expect(l3.get("message")).to.eq(
        "expected **<div>** to match **div**"
      )

      expect(l4.get("message")).to.eq(
        "expected **<div>** not to match **button**"
      )

  context "contain", ->
    it "passes thru non DOM", ->
      expect(['foo']).to.contain('foo') ## 1
      expect({foo: 'bar', baz: "quux"}).to.contain({foo: "bar"}) ## 2, 3
      expect('foo').to.contain('fo') ## 4

      expect(@logs.length).to.eq(4)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]
      l4 = @logs[3]

      expect(l1.get("message")).to.eq(
        "expected **[ foo ]** to include **foo**"
      )

      expect(l2.get("message")).to.eq(
        "expected **{ foo: bar, baz: quux }** to have a property **foo**"
      )

      expect(l3.get("message")).to.eq(
        "expected **{ foo: bar, baz: quux }** to have a property **foo** of **bar**"
      )

      expect(l4.get("message")).to.eq(
        "expected **foo** to include **fo**"
      )

  context "attr", ->
    beforeEach ->
      @$div = $("<div foo='bar'>foo</div>")
      @$div.attr = -> throw new Error("attr called")

      @$a = $("<a href='https://google.com'>google</a>")
      @$a.attr = -> throw new Error("attr called")

    it "attr, not attr", ->
      expect(@$div).to.have.attr("foo") ## 1
      expect(@$div).to.have.attr("foo", "bar") ## 2
      expect(@$div).not.to.have.attr("bar") ## 3
      expect(@$div).not.to.have.attr("bar", "baz") ## 4
      expect(@$div).not.to.have.attr("foo", "baz") ## 5

      expect(@$a).to.have.attr("href").and.match(/google/) ## 6, 7
      expect(@$a)
      .to.have.attr("href", "https://google.com") ## 8
      .and.have.text("google") ## 9

      try
        expect(@$a).not.to.have.attr("href", "https://google.com") ## 10
      catch error

      expect(@logs.length).to.eq(10)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]
      l4 = @logs[3]
      l5 = @logs[4]
      l6 = @logs[5]
      l7 = @logs[6]
      l8 = @logs[7]
      l9 = @logs[8]
      l10 = @logs[9]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to have attribute **foo**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** to have attribute **foo** with the value **bar**"
      )

      expect(l3.get("message")).to.eq(
        "expected **<div>** not to have attribute **bar**"
      )

      expect(l4.get("message")).to.eq(
        "expected **<div>** not to have attribute **bar**"
      )

      expect(l5.get("message")).to.eq(
        "expected **<div>** not to have attribute **foo** with the value **baz**"
      )

      expect(l6.get("message")).to.eq(
        "expected **<a>** to have attribute **href**"
      )

      expect(l7.get("message")).to.eq(
        "expected **https://google.com** to match /google/"
      )

      expect(l8.get("message")).to.eq(
        "expected **<a>** to have attribute **href** with the value **https://google.com**"
      )

      expect(l9.get("message")).to.eq(
        "expected **<a>** to have text **google**"
      )

      expect(l10.get("message")).to.eq(
        "expected **<a>** not to have attribute **href** with the value **https://google.com**, but the value was **https://google.com**"
      )

  context "prop", ->
    beforeEach ->
      @$input = $("<input type='checkbox' />")
      @$input.prop("checked", true)
      @$input.prop = -> throw new Error("prop called")

      @$a = $("<a href='/foo'>google</a>")
      @$a.prop = -> throw new Error("prop called")

    it "prop, not prop", ->
      expect(@$input).to.have.prop("checked") ## 1
      expect(@$input).to.have.prop("checked", true) ## 2
      expect(@$input).not.to.have.prop("bar") ## 3
      expect(@$input).not.to.have.prop("bar", "baz") ## 4
      expect(@$input).not.to.have.prop("checked", "baz") ## 5

      href = window.location.origin + "/foo"

      expect(@$a).to.have.prop("href").and.match(/foo/) ## 6, 7
      expect(@$a)
      .to.have.prop("href", href) ## 8
      .and.have.text("google") ## 9

      try
        expect(@$a).not.to.have.prop("href", href) ## 10
      catch error

      expect(@logs.length).to.eq(10)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]
      l4 = @logs[3]
      l5 = @logs[4]
      l6 = @logs[5]
      l7 = @logs[6]
      l8 = @logs[7]
      l9 = @logs[8]
      l10 = @logs[9]

      expect(l1.get("message")).to.eq(
        "expected **<input>** to have property **checked**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<input>** to have property **checked** with the value **true**"
      )

      expect(l3.get("message")).to.eq(
        "expected **<input>** not to have property **bar**"
      )

      expect(l4.get("message")).to.eq(
        "expected **<input>** not to have property **bar**"
      )

      expect(l5.get("message")).to.eq(
        "expected **<input>** not to have property **checked** with the value **baz**"
      )

      expect(l6.get("message")).to.eq(
        "expected **<a>** to have property **href**"
      )

      expect(l7.get("message")).to.eq(
        "expected **#{href}** to match /foo/"
      )

      expect(l8.get("message")).to.eq(
        "expected **<a>** to have property **href** with the value **#{href}**"
      )

      expect(l9.get("message")).to.eq(
        "expected **<a>** to have text **google**"
      )

      expect(l10.get("message")).to.eq(
        "expected **<a>** not to have property **href** with the value **#{href}**, but the value was **#{href}**"
      )

  context "css", ->
    beforeEach ->
      @$div = $("<div style='display: none'>div</div>")
      @$div.css = -> throw new Error("css called")

    it "prop, not prop", ->
      expect(@$div).to.have.css("display") ## 1
      expect(@$div).to.have.css("display", "none") ## 2
      expect(@$div).not.to.have.css("bar") ## 3
      expect(@$div).not.to.have.css("bar", "baz") ## 4
      expect(@$div).not.to.have.css("display", "inline") ## 5

      try
        expect(@$div).not.to.have.css("display", "none") ## 6
      catch error

      expect(@logs.length).to.eq(6)

      l1 = @logs[0]
      l2 = @logs[1]
      l3 = @logs[2]
      l4 = @logs[3]
      l5 = @logs[4]
      l6 = @logs[5]

      expect(l1.get("message")).to.eq(
        "expected **<div>** to have CSS property **display**"
      )

      expect(l2.get("message")).to.eq(
        "expected **<div>** to have CSS property **display** with the value **none**"
      )

      expect(l3.get("message")).to.eq(
        "expected **<div>** not to have CSS property **bar**"
      )

      expect(l4.get("message")).to.eq(
        "expected **<div>** not to have CSS property **bar**"
      )

      expect(l5.get("message")).to.eq(
        "expected **<div>** not to have CSS property **display** with the value **inline**"
      )

      expect(l6.get("message")).to.eq(
        "expected **<div>** not to have CSS property **display** with the value **none**, but the value was **none**"
      )
