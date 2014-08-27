@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.File extends Entities.Model

  class Entities.FilesCollection extends Entities.Collection
    model: Entities.File

    url: "/files"

  API =
    getFiles: ->
      files = new Entities.FilesCollection
      files.fetch()
      files

  App.reqres.setHandler "file:entities", ->
    API.getFiles()