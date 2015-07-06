describe "Command Entities", ->
  beforeEach ->
    @commands = App.request "command:entities"

  context "#createCommand", ->
    beforeEach ->
      @Cypress = $Cypress.create()

    it "instantiates command with white listed attributes from the log", ->
      attrs = {
        event: "Command"
        error: null
        state: "success"
        testId: 123
        hookName: "test"
        type: "parent"
        highlightAttr: "attr"
        name: "visit"
        alias: null
        aliasType: null
        referencesAlias: null
        message: "http://localhost:8000"
        numElements: 1
        numRetries: 1
        visible: true
        coords: {x: 1, y: 2}
        scrollBy: 10
        viewportWidth: 1000
        viewportHeight: 660
        url: "http://localhost:8001"
      }

      @log     = new $Cypress.Log @Cypress
      @log.set attrs

      @command = @commands.createCommand @log
      _.each attrs, (value, key) =>
        expect(@command.get(key)).to.eq value


    it "listens to attrs:changed and sets whitelisted changed attributes", ->
      @log     = new $Cypress.Log @Cypress
      @log.set {
        state: "pending"
        type: "parent"
      }

      @command = @commands.createCommand @log
      expect(@command.get("state")).to.eq "pending"

      @log.set({
        state: "success"
        url: "http://localhost:8001"
      })

      expect(@command.get("state")).to.eq "success"
      expect(@command.get("url")).to.eq "http://localhost:8001"

#   before ->
#     @addCommand = (attrs = {}, type) =>
#       @commands.add attrs, type, {}

#   beforeEach ->
#     ## we're using the runnableModel here because every command
#     ## goes through the .add method twice.  once when its originally
#     ## added to the command collection, and twice when its
#     ## added to its specific runnable's command collection
#     @runnableModel = App.request "runnable:entity", "test"

#     @commands = App.request "command:entities"

#     @commands.on "add", (command, commands, options) =>
#       @runnableModel.addCommand command, options

#   context "#addDom", ->
#     beforeEach ->
#       attrs =
#         id: "instance1"
#         parent: undefined
#         method: "find"
#         canBeParent: true

#       @parent = @addCommand attrs, "dom"

#     it "can add a dom command", ->
#       expect(@commands.length).to.eq 1

#     describe "parent / child commands", ->
#       beforeEach ->
#         attrs =
#           id: "instance2"
#           parent: "instance1"
#           canBeParent: true

#         @child = @addCommand attrs, "dom"

#       it "sets parent on the child", ->
#         expect(@child.parent).to.eq @parent

#       it "sets the parent isParent to true", ->
#         expect(@child.parent.isParent()).to.be.true

#       it "indents based on the parent's indent", ->
#         expect(@child.get("indent")).to.eq @child.parent.get("indent") + 5

#     describe "it clones the parent when its not the last command", ->
#       it "inserts a new parent", ->
#         attrs =
#           id: "instance2"
#           parent: undefined
#           canBeParent: true

#         @addCommand attrs, "dom"

#         attrs =
#           id: "instance3"
#           parent: "instance1"
#           canBeParent: true

#         @child = @addCommand attrs, "dom"

#         expect(@commands.length).to.eq 4
#         expect(@child.parent).not.to.eq @parent

#       it "inserting a new parent should set 'cloned' to true", ->
#         attrs =
#           id: "instance2"
#           parent: undefined
#           canBeParent: true

#         @addCommand attrs, "dom"

#         attrs =
#           id: "instance3"
#           parent: "instance1"

#         @child = @addCommand attrs, "dom"
#         expect(@child.parent.get("isCloned")).to.eq true

#       it "should insert multiple parents until it reaches the root command", ->
#         ## add a child
#         attrs =
#           id: "instance2"
#           parent: "instance1"
#           method: "eq"
#           canBeParent: true

#         @addCommand attrs, "dom"

#         ## add another child
#         attrs =
#           id: "instance3"
#           parent: "instance2"
#           method: "click"

#         @addCommand attrs, "dom"

#         ## this one breaks the chain
#         attrs =
#           id: "instance4"
#           parent: undefined
#           method: "within"
#           canBeParent: true

#         @addCommand attrs, "dom"

#         ## finally continue the chain and generate cloned
#         ## parents
#         attrs =
#           id: "instance5"
#           parent: "instance2"
#           method: "click"

#         click = @addCommand attrs, "dom"

#         ## click should generate 2 parents
#         ## 1 parent for the 'eq'
#         ## 1 parent for the 'find'
#         expect(@commands.length).to.eq 7

#       it "does not insert multiple parents during normal chaining", ->
#         # Ecl.find("#todo-list li").eq(0).find("input.toggle").click()
#         attrs =
#           id: "instance2"
#           parent: "instance1"
#           method: "eq"
#           canBeParent: true

#         @addCommand attrs, "dom"

#         attrs =
#           id: "instance3"
#           parent: "instance2"
#           method: "find"
#           canBeParent: true

#         @addCommand attrs, "dom"

#         attrs =
#           id: "instance4"
#           parent: "instance3"
#           method: "click"

#         @addCommand attrs, "dom"

#         expect(@commands.length).to.eq 4

#   context "#addXhr", ->
#     it "sets the response on child commands", ->
#       attrs =
#         parent: undefined
#         id: "instance1"

#       @parent = @addCommand attrs, "xhr"

#       setResponse = sinon.stub(App.Entities.Command.prototype, "setResponse").returns({})

#       attrs =
#         parent: "instance1"
#         id: "instance2"
#         canBeParent: true
#         response: {}

#       child = @addCommand attrs, "xhr"
#       expect(setResponse).to.be.called

#     ## xhr's are no longer parent / child
#     # context "parent / child xhrs", ->
#     #   beforeEach ->
#     #     attrs =
#     #       parent: undefined
#     #       id: "instance1"
#     #       canBeParent: true

#     #     parent = @addCommand attrs, "xhr"

#     #     attrs =
#     #       parent: undefined
#     #       id: "instance2"
#     #       canBeParent: true

#     #     @addCommand attrs, "xhr"

#     #     attrs =
#     #       parent: "instance1"
#     #       id: "instance3"

#     #     @child = @addCommand attrs, "xhr"

#     #   it "does not insert reinsert parents if all of the parents are xhrs", ->
#     #     expect(@commands).to.have.length 3

#     #   it "children are inserted into the correct index within the collection", ->
#     #     commands = @runnableModel.get("hooks").first().get("commands")
#     #     expect(commands.indexOf(@child)).to.eq 1

#   context "#addServer", ->
#     it "emits server command", ->
#       attrs =
#         id: "instance1"

#       command = @addCommand attrs, "server"
#       expect(command.get("type")).to.eq "server"