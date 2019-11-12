$ = require("jquery")
_ = require("lodash")

HISTORY_ATTRS = "pushState replaceState".split(" ")

events = []
listenersAdded = null

removeAllListeners = ->
  listenersAdded = false

  for event in events
    [target, event, cb] = event

    target.removeEventListener(event, cb)

  ## reset all the events
  events = []

  return null

addListener = (target, event, cb) ->
  events.push([target, event, cb])

  target.addEventListener(event, cb)

eventHasReturnValue = (e) ->
  val = e.returnValue

  ## return false if val is an empty string
  ## of if its undinefed
  return false if val is "" or _.isUndefined(val)

  ## else return true
  return true

module.exports = {
  isBound: (contentWindow) ->
    return Boolean(listenersAdded)
  
  bindTo: (contentWindow, callbacks = {}) ->
    removeAllListeners()

    listenersAdded = true

    ## set onerror global handler
    contentWindow.onerror = callbacks.onError

    onNavigationEvent = ({ type }) ->
      { stack } = new Error()

      ## this is a synchronous call if onNavigationEvent
      ## frame is in the stack more than once
      isSync = _.count(stack, 'onNavigationEvent') >= 2

      ## if readystatechange event then use the actual
      ## readyState property, else use the event type
      eventName = if type is 'readystatechange' then contentWindow.document.readyState else type

      callbacks.onNavigationEvent(eventName, isSync)

    addListener(contentWindow.document, "readystatechange", onNavigationEvent)
    
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
