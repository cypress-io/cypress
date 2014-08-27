describe "Command Entities", ->
  before ->
    @addCommand = (attrs = {}, type) =>
      @commands.add attrs, type, {}

  beforeEach ->
    @commands = App.request "command:entities"

  context "#addDom", ->
    beforeEach ->
      attrs =
        id: "instance1"
        parent: undefined
        method: "find"
        canBeParent: true

      @parent = @addCommand attrs, "dom"

    it "can add a dom command", ->
      expect(@commands.length).to.eq 1

    describe "parent / child commands", ->
      beforeEach ->
        attrs =
          id: "instance2"
          parent: "instance1"
          canBeParent: true

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
          id: "instance2"
          parent: undefined
          canBeParent: true

        @addCommand attrs, "dom"

        attrs =
          id: "instance3"
          parent: "instance1"
          canBeParent: true

        @child = @addCommand attrs, "dom"

        expect(@commands.length).to.eq 4
        expect(@child.parent).not.to.eq @parent

      it "inserting a new parent should set 'cloned' to true", ->
        attrs =
          id: "instance2"
          parent: undefined
          canBeParent: true

        @addCommand attrs, "dom"

        attrs =
          id: "instance3"
          parent: "instance1"

        @child = @addCommand attrs, "dom"
        expect(@child.parent.get("isCloned")).to.eq true

      it "should insert multiple parents until it reaches the root command", ->
        ## add a child
        attrs =
          id: "instance2"
          parent: "instance1"
          method: "eq"
          canBeParent: true

        @addCommand attrs, "dom"

        ## add another child
        attrs =
          id: "instance3"
          parent: "instance2"
          method: "click"

        @addCommand attrs, "dom"

        ## this one breaks the chain
        attrs =
          id: "instance4"
          parent: undefined
          method: "within"
          canBeParent: true

        @addCommand attrs, "dom"

        ## finally continue the chain and generate cloned
        ## parents
        attrs =
          id: "instance5"
          parent: "instance2"
          method: "click"

        click = @addCommand attrs, "dom"

        ## click should generate 2 parents
        ## 1 parent for the 'eq'
        ## 1 parent for the 'find'
        expect(@commands.length).to.eq 7

      it "does not insert multiple parents during normal chaining", ->
        # Ecl.find("#todo-list li").eq(0).find("input.toggle").click()
        attrs =
          id: "instance2"
          parent: "instance1"
          method: "eq"
          canBeParent: true

        @addCommand attrs, "dom"

        attrs =
          id: "instance3"
          parent: "instance2"
          method: "find"
          canBeParent: true

        @addCommand attrs, "dom"

        attrs =
          id: "instance4"
          parent: "instance3"
          method: "click"

        @addCommand attrs, "dom"

        expect(@commands.length).to.eq 4

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
        canBeParent: true
        response: {}

      child = @addCommand attrs, "xhr"
      expect(setResponse).to.be.called