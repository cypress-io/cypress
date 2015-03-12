window.Simulate = do ($, _) ->

  $.fn.cySimulate = (event, options) ->
    @each (index, el) ->
      Simulate.create(el, event, options)

  events = [
    {event: "click",    type: "MouseEvents",    bubbles: true, cancelable: true}
    {event: "dblclick", type: "MouseEvents",    bubbles: true, cancelable: true}
    {event: "blur",     type: "FocusEvents",    bubbles: false, cancelable: false}
    {event: "focus",    type: "FocusEvents",    bubbles: false, cancelable: false}
    {event: "focusin",  type: "FocusEvents",    bubbles: true, cancelable: false}
    {event: "focusout", type: "FocusEvents",    bubbles: true, cancelable: false}
    {event: "keydown",  type: "KeyboardEvents", bubbles: true, cancelable: true}
    {event: "keypress", type: "KeyboardEvents", bubbles: true, cancelable: true}
    {event: "keyup",    type: "KeyboardEvents", bubbles: true, cancelable: true}
  ]

  Simulate = {
    create: (el, event, options) ->
      switch
        when _(events).findWhere({event:event})
          new Simulate.Native(el, event, options)
  }

  class Simulate.Native
    constructor: (el, event, options = {}) ->
      @document = el.ownerDocument
      @window   = @getWindowByDocument(@document)

      @initialize(el, event, options)

    initialize: (el, event, options) ->
      eventObj = @createEvent(el, event, options)
      @dispatchEvent(el, eventObj)

    getWindowByDocument: (document) ->
      _.find window.frames, (frame, index) ->
        try
          frame.document is document

    createEvent: (el, event, options) ->
      obj = @lookupEventObj(event)

      method = @getEventMethodByType(obj.type)
      method.call @, el, obj, options

    dispatchEvent: (el, event) ->
      el.dispatchEvent(event)

    lookupEventObj: (event) ->
      _(events).findWhere({event: event}) or
        throw new Error("Event: #{event} was not found as an available event to simulate!")

    getEventMethodByType: (type) ->
      method = "on" + type
      throw new Error("Event method: #{method} does not exist on Simulate") if not @[method]
      @[method]

    onKeyboardEvents: (el, obj, options) ->
      _.defaults options,
        bubbles: obj.bubbles
        cancelable: obj.cancelable

      # e = document.createEvent("KeyboardEvent")
      # e.initKeyboardEvent obj.type, obj.bubbles, obj.cancelable, null, options.keyCode, options.charCode, null, null, null
      # e

      new KeyboardEvent(obj.event, options)

    onFocusEvents: (el, obj, options) ->
      _.defaults options,
        bubbles: obj.bubbles
        cancelable: obj.cancelable

      new FocusEvent(obj.event, options)

    onMouseEvents: (el, obj, options) ->
      offset = $(el).offset()
      $doc   = $(@document)

      _.defaults options,
        bubbles: obj.bubbles
        cancelable: obj.cancelable
        view: @window
        detail: 1
        screenX: 0
        screenY: 0
        clientX: offset.left - $doc.scrollLeft()
        clientY: offset.top - $doc.scrollTop()
        ctrlKey: false
        altKey: false
        shiftKey: false
        metaKey: false
        button: 0
        relatedTarget: null

      switch
        when document.createEvent
          ## https://developer.mozilla.org/en-US/docs/Web/API/event.initMouseEvent
          # event = document.createEvent("MouseEvents")
          event = new MouseEvent(obj.event, options)
          # event.initMouseEvent.apply event, [
          #   obj.event, ## type (click / dblclick / mousedown / mouseup)
          #   obj.bubbles,
          #   obj.cancelable,
          #   options.view,
          #   options.detail,
          #   options.screenX
          #   options.screenY
          # ]

          ## need to research what other properties should
          ## be added to the event object
          # event.pageX = offset.left
          # event.pageY = offset.top

        when document.createEventObject then ""

    onHTMLEvents: (event, options) ->

    onKeyEvents: (event, options) ->

    onTouchEvents: (event, options) ->

  return Simulate