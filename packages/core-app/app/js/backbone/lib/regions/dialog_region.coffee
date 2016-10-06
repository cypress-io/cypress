@App.module "Regions", (Regions, App, Backbone, Marionette, $, _) ->

  class Regions.Dialog extends Marionette.Region

    onShow: (view) ->
      @setupBindings view

      options = @getDefaultOptions _.result(view, "dialog")

      @openDialog options, view

    setupBindings: (view) ->
      ## after bootstrap hide animation
      ## listen to hidden event, then empty
      @$el.on "hidden.bs.modal", =>
        @empty(true)

    getDefaultOptions: (options = {}) ->
      options.close = (e, ui) => @empty()

      _.defaults options,
        dialogClass: options.className ? ""
        icon: false

    attachHtml: (view) ->
      # 1. create the wrapper DOM
      # 2. insert the view's el into .modal-body
      @$el.html("<div class='modal-dialog hide'>
        <div class='modal-content'>
          <div class='modal-body'></div>
        </div>
      </div>")

      @$el.find(".modal-body").append(view.el)

    openDialog: (options, view) ->
      # setup the class structure BS requires
      backdrop = $(".modal-backdrop")

      @$el
        .addClass("modal fade")
        .attr("tabindex", "-1")
        .find(".modal-dialog").removeClass("hide")

      @$el.modal()

      @$el.find(".modal-title").prepend("<i class='#{options.icon}'>") if options.icon

    onEmpty: (view) ->
      ## stop listening to hidden
      @$el.off("hidden.bs.modal")

      ## clean up the dialog classes
      @$el.empty().removeClass()