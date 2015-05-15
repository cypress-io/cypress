@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.File extends Entities.Model
    defaults: ->
      children: new Entities.FilesCollection

    hasChildren: ->
      @get("children").length

    setFullPath: (array) ->
      @set "fullPath", array.join("/")

  class Entities.FilesCollection extends Entities.Collection
    model: Entities.File

    url: "/__cypress/files"

    # comparator: (a, b) ->
    #   ## if a.children.length is 0 and b.children.length is 0
    #   ## then compare their names
    #   # if a.get("children").length is 0 and b.get("children").length is 0
    #     # return @sortByName(a, b)

    #   ## else if b's children length is 0 move it up (return -1)
    #   # if b.get("children").length is 0
    #     # return -1


    #   if a.get("children").length is 0
    #     return 1

    #   @sortByName(a, b)

    # sortByName: (a, b) ->
    #   if a.get("name") > b.get("name") then 1 else -1
    #   # if a.get("children").length > 0 then a.get("name") else 0
    #   # if model.get("children").length > 0
    #   #   return model.get("name")

    #   # 0

    parse: (resp, opts) ->
      @path = opts.xhr.getResponseHeader("X-Files-Path")
      resp

    findByName: (path) ->
      @findWhere name: path

    getFilesSplitByDirectory: ->
      @map (file) ->
        file.get("name").split("/")

    ## recursively apply toJSON on all children nodes
    toJSON: ->
      _.map super, (obj) ->
        obj.children = obj.children.toJSON()
        obj

    resetToTreeView: ->
      files = new Entities.FilesCollection

      _.each @getFilesSplitByDirectory(), (array) ->

        _.reduce array, (memo, path, index) ->

          ## attempt to find an existing model
          ## on the collection memo by its path name
          model = memo.findByName path

          ## if its not found then we know we need to
          ## push a new model into the memo collection
          model ?= memo.push {name: path}

          ## set the full path if its the file model
          model.setFullPath(array) if _(array).last() is path

          ## and always return the model's children
          model.get("children")

        , files

      @reset files.models

  API =
    getFiles: ->
      files = new Entities.FilesCollection
      files.fetch
        reset: true
      files

  App.reqres.setHandler "file:entities", ->
    API.getFiles()

# [
#   {
#     name: "apps"
#     children: [
#       { name: "app_spec.coffee" }
#       {
#         name: "accounts", children: [
#           { name: "account_new_spec" }
#         ]
#       }
#     ]
#   }
# ]