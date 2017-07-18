$ = require("jquery")
_ = require("lodash")

$win = null

reset = ->
  if $win
    $win.off()
    $win = null

eventHasReturnValue = (e) ->
  val = e.originalEvent.returnValue

  ## return false if val is an empty string
  ## of if its undinefed
  return false if val is "" or _.isUndefined(val)

  ## else return true
  return true

module.exports = {
  bindTo: (contentWindow, callbacks = {}) ->
    reset()

    ## TODO: do we still need to do this?
    return if contentWindow.location.href is "about:blank"

    $win = $(contentWindow)

    ## using the native submit method will not trigger a
    ## beforeunload event synchronously so we must bind
    ## to the submit event to know we're about to navigate away
    $win.on "submit", (e) ->
      ## if we've prevented the default submit action
      ## without stopping propagation, we will still
      ## receive this event even though the form
      ## did not submit
      return if e.isDefaultPrevented()

      ## else we know to proceed onwards!
      callbacks.onSubmit(e)

    $win.on "beforeunload", (e) =>
      ## bail if we've cancelled this event (from another source)
      ## or we've set a returnValue on the original event
      return if e.isDefaultPrevented() or eventHasReturnValue(e)

      callbacks.onBeforeUnload(e)

    $win.on("hashchange", callbacks.onHashChange)

    contentWindow.alert = callbacks.onAlert
    contentWindow.confirm = callbacks.onConfirm

}
