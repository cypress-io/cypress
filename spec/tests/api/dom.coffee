describe "Dom Command API", ->
  before ->
    sinon.stub(Eclectus.Dom.prototype, "emit").returns(null)

  after ->
    Eclectus.Dom.prototype.emit.restore()

  beforeEach ->
    df = $.Deferred()

    _this = @

    $("iframe").remove()

    iframe = $("<iframe />", {
      src: "/fixtures/dom.html"
      class: "iframe-spec"
      load: ->
        _this.dom = Eclectus.createDom {contentWindow: @contentWindow}
        df.resolve()
    })

    iframe.appendTo $("body")

    df

  it "stores the iframe's document", ->
    expect(@dom.document).to.eq $("iframe")[0].contentWindow.document

  it "uses '$' to reference the iframe document", ->
    el = @dom.$("#dom")[0]
    el2 = $("iframe").contents().find("#dom")[0]
    expect(el).to.eq el2

  describe "#find", ->
    beforeEach ->
      @dom.find "#dom"

    it "sets $el", ->
      expect(@dom.$el).to.be.instanceof($)

    it "sets length", ->
      expect(@dom.length).to.eq @dom.$el.length

    it "sets selector to the first argument", ->
      expect(@dom.selector).to.eq "#dom"

    context "chaining #find off of existing Dom instance", ->
      beforeEach ->
        @dom2 = @dom.find("#nested-find")

      it "returns a new Dom instance", ->
        expect(@dom2).not.to.eq @dom

      it "sets the parent of dom2 to dom", ->
        expect(@dom2.parent).to.eq @dom

  describe "#within", ->
    beforeEach ->
      @dom.within "#dom", =>
        @dom2 = Eclectus::find "#nested-find"

    it "sets $el", ->
      expect(@dom.$el).to.be.instanceof($)

    it "sets length", ->
      expect(@dom.length).to.eq @dom.$el.length

    it "sets selector to the first argument", ->
      expect(@dom.selector).to.eq "#dom"

    context "nested method within (#within)", ->
      it "sets parent of dom2 to dom", ->
        expect(@dom2.parent).to.eq @dom

  describe "traversal methods", ->
    it "throws if calling these methods directly"

    context "eq", ->
      beforeEach ->
        @eq = @dom.find("#list li").eq(0)
        @eq.dom = @eq.getDom()

      it "returns a new dom instance", ->
        expect(@eq).not.to.eq @dom

      it "sets the parent dom instance", ->
        expect(@eq.parent).to.eq @dom

      it "sets selector to 0", ->
        expect(@eq.selector).to.eq 0

      it "sets length to 1", ->
        expect(@eq.length).to.eq 1

      it "sets $el to the first li", ->
        li = $("iframe").contents().find("#list li").eq(0)[0]
        expect(@eq.$el[0]).to.eq li

      it "sets the dom", ->
        expect(@eq.dom).to.be.instanceof($)

      it "allows the el to be findable in the stored dom", ->
        li = @eq.dom.find("[data-eclectus-el]")
        expect(li).to.have.prop "nodeName", "LI"

      it "removes the special data-eclectus-el selector from $el", ->
        expect(@eq.$el).not.to.have.attr "data-eclectus-el"
