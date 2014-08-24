describe "Command Entities", ->
  before ->
    @addCommand = (attrs = {}, type) =>
      @commands.add attrs, type, {}

  beforeEach ->
    @commands = App.request "command:entities"

  context "#addDom", ->
    beforeEach ->
      attrs =
        parent: undefined
        id: "instance1"

      @parent = @addCommand attrs, "dom"

    it "can add a dom command", ->
      expect(@commands.length).to.eq 1

    describe "parent / child commands", ->
      beforeEach ->
        attrs =
          parent: "instance1"
          id: "instance2"

        @child = @addCommand attrs, "dom"

      it "sets parent on the child", ->
        expect(@child.parent).to.eq @parent

      it "sets the parent isParent to true", ->
        expect(@child.parent.isParent()).to.be.true

      it "indents based on the parent's indent", ->
        expect(@child.get("indent")).to.eq @child.parent.get("indent") + 17

    describe "it clones the parent when its not the last command", ->
      it "inserts a new parent", ->
        attrs =
          parent: undefined
          id: "instance2"

        @addCommand attrs, "dom"

        attrs =
          parent: "instance1"
          id: "instance3"

        @child = @addCommand attrs, "dom"

        expect(@commands.length).to.eq 4
        expect(@child.parent).not.to.eq @parent

  context "#addXhr", ->
    it "sets the response on child commands", ->
      attrs =
        parent: undefined
        id: "instance1"

      @parent = @addCommand attrs, "xhr"

      setResponse = sinon.stub(App.Entities.Command.prototype, "setResponse").returns({})

      attrs =
        parent: "instance1"
        id: "instance2"
        response: {}

      child = @addCommand attrs, "xhr"
      expect(setResponse).to.be.called