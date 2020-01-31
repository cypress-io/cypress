exports['e2e forms / <form> submissions / passes with https on localhost'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_multipart_spec.coffee)                                    │
  │ Searched:   cypress/integration/form_submission_multipart_spec.coffee                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_multipart_spec.coffee                                           (1 of 1)


  <form> submissions
    ✓ can submit a form correctly
    ✓ can submit a multipart/form-data form correctly
    can submit a multipart/form-data form with attachments
      ✓ image/png
      ✓ application/pdf
      ✓ image/jpeg
      ✓ large application/pdf
      ✓ large image/jpeg


  7 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_multipart_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_multipart_spec.     (X second)
                          coffee.mp4                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  form_submission_multipart_spec.coff      XX:XX        7        7        -        -        - │
  │    ee                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e forms / <form> submissions / passes with http on localhost'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_multipart_spec.coffee)                                    │
  │ Searched:   cypress/integration/form_submission_multipart_spec.coffee                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_multipart_spec.coffee                                           (1 of 1)


  <form> submissions
    ✓ can submit a form correctly
    ✓ can submit a multipart/form-data form correctly
    can submit a multipart/form-data form with attachments
      ✓ image/png
      ✓ application/pdf
      ✓ image/jpeg
      ✓ large application/pdf
      ✓ large image/jpeg


  7 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_multipart_spec.coffee                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_multipart_spec.     (X second)
                          coffee.mp4                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  form_submission_multipart_spec.coff      XX:XX        7        7        -        -        - │
  │    ee                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        7        7        -        -        -  


`

exports['e2e forms / submissions with jquery XHR POST / failing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_failing_spec.coffee)                                      │
  │ Searched:   cypress/integration/form_submission_failing_spec.coffee                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_failing_spec.coffee                                             (1 of 1)


  form submission fails
    1) fails without an explicit wait when an element is immediately found


  0 passing
  1 failing

  1) form submission fails fails without an explicit wait when an element is immediately found:

      AssertionError: expected '<form>' to contain 'form success!'
      + expected - actual

      -{ '0': 
      -   <form>
      -       What is your name?
      -       <input name="name">
      -       <button id="submit" type="submit">submit</button>
      -     </form>,
      -  length: 1,
      -  jquery: '3.1.0',
      -  constructor: 
      -   { [Function: jQuery]
      -     fn: 
      -      { jquery: '3.1.0',
      -        constructor: [Circular],
      -        length: 0,
      -        toArray: [Function: toArray],
      -        get: [Function: get],
      -        pushStack: [Function: pushStack],
      -        each: [Function: each],
      -        map: [Function: map],
      -        slice: [Function: slice],
      -        first: [Function: first],
      -        last: [Function: last],
      -        eq: [Function: eq],
      -        end: [Function: end],
      -        push: [Function: push],
      -        sort: [Function: sort],
      -        splice: [Function: splice],
      -        extend: [Function],
      -        find: [Function: find],
      -        filter: [Function: filter],
      -        not: [Function: not],
      -        is: [Function: is],
      -        init: [Function],
      -        has: [Function: has],
      -        closest: [Function: closest],
      -        index: [Function: index],
      -        add: [Function: add],
      -        addBack: [Function: addBack],
      -        parent: [Function],
      -        parents: [Function],
      -        parentsUntil: [Function],
      -        next: [Function],
      -        prev: [Function],
      -        nextAll: [Function],
      -        prevAll: [Function],
      -        nextUntil: [Function],
      -        prevUntil: [Function],
      -        siblings: [Function],
      -        children: [Function],
      -        contents: [Function],
      -        ready: [Function],
      -        data: [Function: data],
      -        removeData: [Function: removeData],
      -        queue: [Function: queue],
      -        dequeue: [Function: dequeue],
      -        clearQueue: [Function: clearQueue],
      -        promise: [Function: promise],
      -        show: [Function],
      -        hide: [Function],
      -        toggle: [Function],
      -        on: [Function: on],
      -        one: [Function: one],
      -        off: [Function: off],
      -        detach: [Function: detach],
      -        remove: [Function: remove],
      -        text: [Function: text],
      -        append: [Function: append],
      -        prepend: [Function: prepend],
      -        before: [Function: before],
      -        after: [Function: after],
      -        empty: [Function: empty],
      -        clone: [Function: clone],
      -        html: [Function: html],
      -        replaceWith: [Function: replaceWith],
      -        appendTo: [Function],
      -        prependTo: [Function],
      -        insertBefore: [Function],
      -        insertAfter: [Function],
      -        replaceAll: [Function],
      -        css: [Function: css],
      -        fadeTo: [Function: fadeTo],
      -        animate: [Function: animate],
      -        stop: [Function: stop],
      -        finish: [Function: finish],
      -        slideDown: [Function],
      -        slideUp: [Function],
      -        slideToggle: [Function],
      -        fadeIn: [Function],
      -        fadeOut: [Function],
      -        fadeToggle: [Function],
      -        delay: [Function],
      -        attr: [Function: attr],
      -        removeAttr: [Function: removeAttr],
      -        prop: [Function: prop],
      -        removeProp: [Function: removeProp],
      -        addClass: [Function: addClass],
      -        removeClass: [Function: removeClass],
      -        toggleClass: [Function: toggleClass],
      -        hasClass: [Function: hasClass],
      -        val: [Function: val],
      -        trigger: [Function: trigger],
      -        triggerHandler: [Function: triggerHandler],
      -        blur: [Function],
      -        focus: [Function],
      -        focusin: [Function],
      -        focusout: [Function],
      -        resize: [Function],
      -        scroll: [Function],
      -        click: [Function],
      -        dblclick: [Function],
      -        mousedown: [Function],
      -        mouseup: [Function],
      -        mousemove: [Function],
      -        mouseover: [Function],
      -        mouseout: [Function],
      -        mouseenter: [Function],
      -        mouseleave: [Function],
      -        change: [Function],
      -        select: [Function],
      -        submit: [Function],
      -        keydown: [Function],
      -        keypress: [Function],
      -        keyup: [Function],
      -        contextmenu: [Function],
      -        hover: [Function: hover],
      -        serialize: [Function: serialize],
      -        serializeArray: [Function: serializeArray],
      -        wrapAll: [Function: wrapAll],
      -        wrapInner: [Function: wrapInner],
      -        wrap: [Function: wrap],
      -        unwrap: [Function: unwrap],
      -        load: [Function],
      -        ajaxStart: [Function],
      -        ajaxStop: [Function],
      -        ajaxComplete: [Function],
      -        ajaxError: [Function],
      -        ajaxSuccess: [Function],
      -        ajaxSend: [Function],
      -        offset: [Function: offset],
      -        position: [Function: position],
      -        offsetParent: [Function: offsetParent],
      -        scrollLeft: [Function],
      -        scrollTop: [Function],
      -        innerHeight: [Function],
      -        height: [Function],
      -        outerHeight: [Function],
      -        innerWidth: [Function],
      -        width: [Function],
      -        outerWidth: [Function],
      -        bind: [Function: bind],
      -        unbind: [Function: unbind],
      -        delegate: [Function: delegate],
      -        undelegate: [Function: undelegate] },
      -     extend: [Function],
      -     expando: 'jQuery310009477964392086324',
      -     isReady: true,
      -     error: [Function: error],
      -     noop: [Function: noop],
      -     isFunction: [Function: isFunction],
      -     isArray: [Function: isArray],
      -     isWindow: [Function: isWindow],
      -     isNumeric: [Function: isNumeric],
      -     isPlainObject: [Function: isPlainObject],
      -     isEmptyObject: [Function: isEmptyObject],
      -     type: [Function: type],
      -     globalEval: [Function: globalEval],
      -     camelCase: [Function: camelCase],
      -     nodeName: [Function: nodeName],
      -     each: [Function: each],
      -     trim: [Function: trim],
      -     makeArray: [Function: makeArray],
      -     inArray: [Function: inArray],
      -     merge: [Function: merge],
      -     grep: [Function: grep],
      -     map: [Function: map],
      -     guid: 2,
      -     proxy: [Function: proxy],
      -     now: [Function: now],
      -     support: 
      -      { checkClone: true,
      -        noCloneChecked: true,
      -        clearCloneStyle: true,
      -        pixelPosition: [Function: pixelPosition],
      -        boxSizingReliable: [Function: boxSizingReliable],
      -        pixelMarginRight: [Function: pixelMarginRight],
      -        reliableMarginLeft: [Function: reliableMarginLeft],
      -        checkOn: true,
      -        optSelected: true,
      -        radioValue: true,
      -        focusin: false,
      -        cors: true,
      -        ajax: true,
      -        createHTMLDocument: true },
      -     find: 
      -      { [Function: Sizzle]
      -        support: [Object],
      -        isXML: [Function],
      -        setDocument: [Function],
      -        matches: [Function],
      -        matchesSelector: [Function],
      -        contains: [Function],
      -        attr: [Function],
      -        escape: [Function],
      -        error: [Function],
      -        uniqueSort: [Function],
      -        getText: [Function],
      -        selectors: [Object],
      -        tokenize: [Function],
      -        compile: [Function],
      -        select: [Function] },
      -     expr: 
      -      { cacheLength: 50,
      -        createPseudo: [Function: markFunction],
      -        match: [Object],
      -        attrHandle: [Object],
      -        find: [Object],
      -        relative: [Object],
      -        preFilter: [Object],
      -        filter: [Object],
      -        pseudos: [Object],
      -        filters: [Object],
      -        setFilters: [Object],
      -        ':': [Object] },
      -     unique: [Function],
      -     uniqueSort: [Function],
      -     text: [Function],
      -     isXMLDoc: [Function],
      -     contains: [Function],
      -     escapeSelector: [Function],
      -     filter: [Function],
      -     Callbacks: [Function],
      -     Deferred: { [Function: Deferred] exceptionHook: [Function] },
      -     when: [Function: when],
      -     readyException: [Function],
      -     readyWait: 0,
      -     holdReady: [Function: holdReady],
      -     ready: { [Function: ready] then: [Function: then] },
      -     hasData: [Function: hasData],
      -     data: [Function: data],
      -     removeData: [Function: removeData],
      -     _data: [Function: _data],
      -     _removeData: [Function: _removeData],
      -     queue: [Function: queue],
      -     dequeue: [Function: dequeue],
      -     _queueHooks: [Function: _queueHooks],
      -     event: 
      -      { global: [Object],
      -        add: [Function: add],
      -        remove: [Function: remove],
      -        dispatch: [Function: dispatch],
      -        handlers: [Function: handlers],
      -        addProp: [Function: addProp],
      -        fix: [Function: fix],
      -        special: [Object],
      -        trigger: [Function: trigger],
      -        simulate: [Function: simulate] },
      -     removeEvent: [Function],
      -     Event: [Function],
      -     htmlPrefilter: [Function: htmlPrefilter],
      -     clone: [Function: clone],
      -     cleanData: [Function: cleanData],
      -     cssHooks: 
      -      { opacity: [Object],
      -        height: [Object],
      -        width: [Object],
      -        marginLeft: [Object],
      -        margin: [Object],
      -        padding: [Object],
      -        borderWidth: [Object],
      -        top: [Object],
      -        left: [Object] },
      -     cssNumber: 
      -      { animationIterationCount: true,
      -        columnCount: true,
      -        fillOpacity: true,
      -        flexGrow: true,
      -        flexShrink: true,
      -        fontWeight: true,
      -        lineHeight: true,
      -        opacity: true,
      -        order: true,
      -        orphans: true,
      -        widows: true,
      -        zIndex: true,
      -        zoom: true },
      -     cssProps: { float: 'cssFloat' },
      -     style: [Function: style],
      -     css: [Function: css],
      -     Tween: { [Function: Tween] propHooks: [Object] },
      -     easing: 
      -      { linear: [Function: linear],
      -        swing: [Function: swing],
      -        _default: 'swing' },
      -     fx: 
      -      { [Function: init]
      -        step: {},
      -        tick: [Function],
      -        timer: [Function],
      -        interval: 13,
      -        start: [Function],
      -        stop: [Function],
      -        speeds: [Object] },
      -     Animation: 
      -      { [Function: Animation]
      -        tweeners: [Object],
      -        tweener: [Function: tweener],
      -        prefilters: [Object],
      -        prefilter: [Function: prefilter] },
      -     speed: [Function],
      -     timers: [],
      -     attr: [Function: attr],
      -     attrHooks: { type: [Object] },
      -     removeAttr: [Function: removeAttr],
      -     prop: [Function: prop],
      -     propHooks: { tabIndex: [Object] },
      -     propFix: 
      -      { for: 'htmlFor',
      -        class: 'className',
      -        tabindex: 'tabIndex',
      -        readonly: 'readOnly',
      -        maxlength: 'maxLength',
      -        cellspacing: 'cellSpacing',
      -        cellpadding: 'cellPadding',
      -        rowspan: 'rowSpan',
      -        colspan: 'colSpan',
      -        usemap: 'useMap',
      -        frameborder: 'frameBorder',
      -        contenteditable: 'contentEditable' },
      -     valHooks: 
      -      { option: [Object],
      -        select: [Object],
      -        radio: [Object],
      -        checkbox: [Object] },
      -     parseXML: [Function],
      -     param: [Function],
      -     active: 0,
      -     lastModified: {},
      -     etag: {},
      -     ajaxSettings: 
      -      { url: 'http://localhost:35099/forms.html',
      -        type: 'GET',
      -        isLocal: false,
      -        global: true,
      -        processData: true,
      -        async: true,
      -        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      -        accepts: [Object],
      -        contents: [Object],
      -        responseFields: [Object],
      -        converters: [Object],
      -        flatOptions: [Object],
      -        xhr: [Function],
      -        jsonp: 'callback',
      -        jsonpCallback: [Function: jsonpCallback] },
      -     ajaxSetup: [Function: ajaxSetup],
      -     ajaxPrefilter: [Function],
      -     ajaxTransport: [Function],
      -     ajax: [Function: ajax],
      -     getJSON: [Function: getJSON],
      -     getScript: [Function: getScript],
      -     get: [Function],
      -     post: [Function],
      -     _evalUrl: [Function],
      -     parseHTML: [Function],
      -     offset: { setOffset: [Function: setOffset] },
      -     parseJSON: [Function: parse],
      -     noConflict: [Function] },
      -  toArray: [Function: toArray],
      -  get: [Function: get],
      -  pushStack: [Function: pushStack],
      -  each: [Function: each],
      -  map: [Function: map],
      -  slice: [Function: slice],
      -  first: [Function: first],
      -  last: [Function: last],
      -  eq: [Function: eq],
      -  end: [Function: end],
      -  push: [Function: push],
      -  sort: [Function: sort],
      -  splice: [Function: splice],
      -  extend: [Function],
      -  find: [Function: find],
      -  filter: [Function: filter],
      -  not: [Function: not],
      -  is: [Function: is],
      -  init: [Function],
      -  has: [Function: has],
      -  closest: [Function: closest],
      -  index: [Function: index],
      -  add: [Function: add],
      -  addBack: [Function: addBack],
      -  parent: [Function],
      -  parents: [Function],
      -  parentsUntil: [Function],
      -  next: [Function],
      -  prev: [Function],
      -  nextAll: [Function],
      -  prevAll: [Function],
      -  nextUntil: [Function],
      -  prevUntil: [Function],
      -  siblings: [Function],
      -  children: [Function],
      -  contents: [Function],
      -  ready: [Function],
      -  data: [Function: data],
      -  removeData: [Function: removeData],
      -  queue: [Function: queue],
      -  dequeue: [Function: dequeue],
      -  clearQueue: [Function: clearQueue],
      -  promise: [Function: promise],
      -  show: [Function],
      -  hide: [Function],
      -  toggle: [Function],
      -  on: [Function: on],
      -  one: [Function: one],
      -  off: [Function: off],
      -  detach: [Function: detach],
      -  remove: [Function: remove],
      -  text: [Function: text],
      -  append: [Function: append],
      -  prepend: [Function: prepend],
      -  before: [Function: before],
      -  after: [Function: after],
      -  empty: [Function: empty],
      -  clone: [Function: clone],
      -  html: [Function: html],
      -  replaceWith: [Function: replaceWith],
      -  appendTo: [Function],
      -  prependTo: [Function],
      -  insertBefore: [Function],
      -  insertAfter: [Function],
      -  replaceAll: [Function],
      -  css: [Function: css],
      -  fadeTo: [Function: fadeTo],
      -  animate: [Function: animate],
      -  stop: [Function: stop],
      -  finish: [Function: finish],
      -  slideDown: [Function],
      -  slideUp: [Function],
      -  slideToggle: [Function],
      -  fadeIn: [Function],
      -  fadeOut: [Function],
      -  fadeToggle: [Function],
      -  delay: [Function],
      -  attr: [Function: attr],
      -  removeAttr: [Function: removeAttr],
      -  prop: [Function: prop],
      -  removeProp: [Function: removeProp],
      -  addClass: [Function: addClass],
      -  removeClass: [Function: removeClass],
      -  toggleClass: [Function: toggleClass],
      -  hasClass: [Function: hasClass],
      -  val: [Function: val],
      -  trigger: [Function: trigger],
      -  triggerHandler: [Function: triggerHandler],
      -  blur: [Function],
      -  focus: [Function],
      -  focusin: [Function],
      -  focusout: [Function],
      -  resize: [Function],
      -  scroll: [Function],
      -  click: [Function],
      -  dblclick: [Function],
      -  mousedown: [Function],
      -  mouseup: [Function],
      -  mousemove: [Function],
      -  mouseover: [Function],
      -  mouseout: [Function],
      -  mouseenter: [Function],
      -  mouseleave: [Function],
      -  change: [Function],
      -  select: [Function],
      -  submit: [Function],
      -  keydown: [Function],
      -  keypress: [Function],
      -  keyup: [Function],
      -  contextmenu: [Function],
      -  hover: [Function: hover],
      -  serialize: [Function: serialize],
      -  serializeArray: [Function: serializeArray],
      -  wrapAll: [Function: wrapAll],
      -  wrapInner: [Function: wrapInner],
      -  wrap: [Function: wrap],
      -  unwrap: [Function: unwrap],
      -  load: [Function],
      -  ajaxStart: [Function],
      -  ajaxStop: [Function],
      -  ajaxComplete: [Function],
      -  ajaxError: [Function],
      -  ajaxSuccess: [Function],
      -  ajaxSend: [Function],
      -  offset: [Function: offset],
      -  position: [Function: position],
      -  offsetParent: [Function: offsetParent],
      -  scrollLeft: [Function],
      -  scrollTop: [Function],
      -  innerHeight: [Function],
      -  height: [Function],
      -  outerHeight: [Function],
      -  innerWidth: [Function],
      -  width: [Function],
      -  outerWidth: [Function],
      -  bind: [Function: bind],
      -  unbind: [Function: unbind],
      -  delegate: [Function: delegate],
      -  undelegate: [Function: undelegate] }
      +'form success!'
      
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_failing_spec.coffee                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/form_submission_failing_spec.coffee/form submis     (1280x720)
     sion fails -- fails without an explicit wait when an element is immediately foun               
     d (failed).png                                                                                 


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_failing_spec.co     (X second)
                          ffee.mp4                                                                  


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  form_submission_failing_spec.coffee      XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e forms / submissions with jquery XHR POST / passing'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_submission_passing_spec.coffee)                                      │
  │ Searched:   cypress/integration/form_submission_passing_spec.coffee                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_submission_passing_spec.coffee                                             (1 of 1)


  form submissions
    ✓ will find 'form success' message by default (after retrying)
    ✓ needs an explicit should when an element is immediately found


  2 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     form_submission_passing_spec.coffee                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/form_submission_passing_spec.co     (X second)
                          ffee.mp4                                                                  


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  form_submission_passing_spec.coffee      XX:XX        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        2        -        -        -  


`
