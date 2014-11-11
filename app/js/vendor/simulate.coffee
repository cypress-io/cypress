do ($, _) ->

  events = [
    {event: "click", type: "MouseEvents", bubbles: true, cancelable: true}
  ]

  class window.Simulate
    constructor: (el, event, options = {}) ->
      @window = @getWindowByDocument(el.ownerDocument)
      eventObj = @createEvent(event, options)
      @dispatchEvent(el, eventObj)

    getWindowByDocument: (document) ->
      _.find window.frames, (frame, index) ->
        try
          frame.document is document

    createEvent: (event, options) ->
      obj = @lookupEvent(event)

      method = @getEventMethodByType(obj.type)
      method.call @, obj, options

    dispatchEvent: (el, eventObj) ->

    lookupEvent: (event) ->
      _(events).findWhere {event: event} or
        throw new Error("Event: #{event} was not found as an available event to simulate!")

    getEventMethodByType: (type) ->
      method = "on" + type
      throw new Error("Event method: #{method} does not exist on Simulate") if not @[method]
      @[method]

    onMouseEvents: (obj, options) ->
      debugger
      _.defaults options,
        view: @window
        detail: 1
        screenX: 0
        screenY: 0
        clientX: 0
        clientY: 0
        ctrlKey: false
        altKey: false
        shiftKey: false
        metaKey: false
        button: 0
        relatedTarget: null

      switch
        when document.createEvent
          ## https://developer.mozilla.org/en-US/docs/Web/API/event.initMouseEvent
          event = document.createEvent("MouseEvents")
          event.initMouseEvent.apply event, [
            obj.event, ## type (click / dblclick / mousedown / mouseup)
            obj.bubbles,
            obj.cancelable,
            options.view,
            options.detail,
            options.screenX
            options.screenY
          ]

        when document.createdEventObject then ""

    onHTMLEvents: (event, options) ->

    onKeyEvents: (event, options) ->

    onTouchEvents: (event, options) ->

  $.fn.simulate = (event, options) ->
    @each (index, el) ->
      new Simulate(el, event, options)