## xhrs are no longer grouped by parent / child
# describe "List Commands App", ->
#   before ->
#     @addXhrCommand = (attrs = {}) =>
#       xhr = xhr: {
#         responseText: ""
#       }
#       _.extend attrs, xhr
#       @commands.add attrs, "xhr", {}

#   beforeEach ->
#     @commands = App.request "command:entities"

#     $("body").append $("<div />", id: "commands")

#   it "renders child xhr commands into the proper index", ->
#     commandsView = new App.TestCommandsApp.List.Commands
#       collection: @commands
#       el: "#commands"

#     commandsView.render()

#     @addXhrCommand
#       id: "instance1"
#       parent: undefined
#       canBeParent: true

#     @addXhrCommand
#       id: "instance2"
#       parent: undefined
#       canBeParent: true

#     child = @addXhrCommand
#       id: "instance3"
#       parent: "instance1"
#       canBeParent: false

#     @addXhrCommand
#       id: "instance4"
#       parent: "instance2"
#       canBeParent: false

#     childView = commandsView.children.findByModel(child)

#     expect(childView.$el.index()).to.eq 1