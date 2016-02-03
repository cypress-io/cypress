@App.module "Regions", (Regions, App, Backbone, Marionette, $, _) ->

  class Regions.Dialog extends Marionette.Region

    onShow: (view) ->
    #   # @setupBindings view

      options = @getDefaultOptions _.result(view, "dialog")
    #   # if _.isFunction(options.title) then options.title = options.title.apply(view)

      @openDialog options, view

    setupBindings: (view) ->
    #   ## hide bootstrap
    #   # @listenTo view, "dialog:close", =>
    #   #   @empty()
    #   # @listenTo view, "dialog:resize", @resizeDialog
    #   # @listenTo view, "dialog:title", @titleizeDialog

    #   # @$el.on "shown.bs.modal", =>
    #   #   view.trigger "dialog:shown"
    #   #   # if form component is there
    #   #   #   focusFirstInput

      ## after bootstrap hide animation
      ## listen to hidden event, then empty
      @$el.on "hidden.bs.modal", =>
        view?.model?.trigger "dialog:hidden", view?.model
        @empty(true)

    getDefaultOptions: (options = {}) ->
      options.close = (e, ui) => @empty()

      _.defaults options,
        title: null
        dialogClass: options.className ? ""
        type: "default"
        icon: false
        attention: false
        backdrop: "static"
        keyboard: false
        loading: false

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

      if zIndex = backdrop.css("zIndex")
        backdrop.css("zindex", _.toNumber(zIndex) - 10)

      @$el
        .addClass("modal fade")
        .addClass("dialog-type-#{options.type}")
        .find(".modal-dialog").removeClass("hide")

      @$el.find(".modal-dialog").addClass("modal-lg") if options.size is "large"

      @$el.modal()

      @$el.find(".modal-title").prepend("<i class='#{options.icon}'>") if options.icon


    onEmpty: (view) ->
      ## stop listening to hidden
      @$el.off("hidden.bs.modal")

      ## clean up the dialog classes
      @$el.empty().removeClass()