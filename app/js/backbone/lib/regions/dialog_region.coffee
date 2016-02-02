@App.module "Regions", (Regions, App, Backbone, Marionette, $, _) ->

  class Regions.Dialog extends Marionette.Region

    onShow: (view) ->
    #   # @setupBindings view

      options = @getDefaultOptions _.result(view, "dialog")
    #   # if _.isFunction(options.title) then options.title = options.title.apply(view)

    #   # @isLoadingView = options.loading

      @openDialog options, view

    # setupBindings: (view) ->
    #   ## hide bootstrap
    #   # @listenTo view, "dialog:close", =>
    #   #   @empty()
    #   # @listenTo view, "dialog:resize", @resizeDialog
    #   # @listenTo view, "dialog:title", @titleizeDialog

    #   # @$el.on "shown.bs.modal", =>
    #   #   view.trigger "dialog:shown"
    #   #   # if form component is there
    #   #   #   focusFirstInput

    #   # ## after bootstrap hide animation
    #   # ## listen to hidden event, then empty
    #   # @$el.on "hidden.bs.modal", =>
    #   #   view?.model?.trigger "dialog:hidden", view?.model
    #   #   @empty(true)

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

      # if @isLoadingView
      #   @$el
      #     ## toggle the loading spinner
      #     .parents("body").modalmanager("loading")
      #       ## prevent clicking on body from closing
      #       ## the 'loading' modalmanager
      #       .find(".modal-scrollable").off("click.modalmanager")
      # else
      @$el
        .addClass("modal fade")
        .addClass("dialog-type-#{options.type}")
        .find(".modal-dialog").removeClass("hide")

      @$el.find(".modal-dialog").addClass("modal-lg") if options.size is "large"

      @titleizeDialog(options.title)

      @$el.modal()
        # width: options.width
        # attention: options.attention

      @$el.find(".modal-title").prepend("<i class='#{options.icon}'>") if options.icon

    # empty: (isHidden) ->
    #   # df = $.Deferred()

    #   # callSuper = =>
    #   #   super

    #   #   df.resolveWith(@)

    #   # ## if we're a loading view or we're already hidden from
    #   # ## hitting ESC or clicking the UI "X"
    #   # ## do not 'hide' view since we will either
    #   # ## be inserting a new view or we're already hidden
    #   # if @isLoadingView or isHidden
    #   #   callSuper()
    #   # else
    #   #   @$el.off("hidden.bs.modal").on "hidden.bs.modal", =>
    #   #     callSuper()

    #   #   @$el.modal("hide")

    #   # @isLoadingView = null

    #   # df

    # onEmpty: (view) ->
    #   # @stopListening()

    #   # ## stop listening to hidden
    #   # @$el.off("hidden.bs.modal")

    #   # ## clean up the dialog classes
    #   # @$el.empty().removeClass()

    # # resizeDialog: ->
    #   ## Readjusts the modal's positioning to counter a scrollbar in case one should appear, which would make the modal jump to the left.
    #   ## Only needed when the height of the modal changes while it is open.
    #   # @$el.modal("handleUpdate")

    titleizeDialog: (title) ->
      @$el.find(".modal-title").text(title)