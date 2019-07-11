$ = require("jquery")
_ = require("lodash")

HISTORY_ATTRS = "pushState replaceState".split(" ")

events = []
listenersAdded = null

removeAllListeners = ->
  listenersAdded = false

  for event in events
    [win, event, cb] = event

    win.removeEventListener(event, cb)

  ## reset all the events
  events = []

  return null

addListener = (win, event, cb) ->
  events.push([win, event, cb])

  win.addEventListener(event, cb)

eventHasReturnValue = (e) ->
  val = e.returnValue

  ## return false if val is an empty string
  ## of if its undinefed
  return false if val is "" or _.isUndefined(val)

  ## else return true
  return true

module.exports = {
  bindTo: (contentWindow, callbacks = {}) ->
    return if listenersAdded

    removeAllListeners()

    listenersAdded = true

    ## set onerror global handler
    contentWindow.onerror = callbacks.onError

    addListener contentWindow, "beforeunload", (e) ->
      ## bail if we've canceled this event (from another source)
      ## or we've set a returnValue on the original event
      return if e.defaultPrevented or eventHasReturnValue(e)

      callbacks.onBeforeUnload(e)

    addListener contentWindow, "unload", (e) ->
      ## when we unload we need to remove all of the event listeners
      removeAllListeners()

      ## else we know to proceed onwards!
      callbacks.onUnload(e)

    addListener contentWindow, "hashchange", (e) ->
      callbacks.onNavigation("hashchange", e)

    for attr in HISTORY_ATTRS
      do (attr) ->
        return if not (orig = contentWindow.history?[attr])

        contentWindow.history[attr] = (args...) ->
          orig.apply(@, args)

          callbacks.onNavigation(attr, args)

    addListener contentWindow, "submit", (e) ->
      ## if we've prevented the default submit action
      ## without stopping propagation, we will still
      ## receive this event even though the form
      ## did not submit
      return if e.defaultPrevented

      ## else we know to proceed onwards!
      callbacks.onSubmit(e)

    contentWindow.alert = callbacks.onAlert
    contentWindow.confirm = callbacks.onConfirm
}
