do (Cypress, _) ->

  Cypress.addChildCommand

    submit: (subject) ->
      @ensureDom(subject)

      subject.each (index, el) =>
        origEl = el
        el = $(el)
        node = Cypress.Utils.stringifyElement(el)

        if not el.is("form")
          word = Cypress.Utils.plural(subject, "contains", "is")
          @throwErr(".submit() can only be called on a <form>! Your subject #{word} a: #{node}")

        submit = new Event("submit")
        origEl.dispatchEvent(submit)

    fill: (subject, obj, options = {}) ->
      @throwErr "cy.fill() must be passed an object literal as its 1st argument!" if not _.isObject(obj)

    check: (subject, values = []) ->
      @ensureDom(subject)

      ## make sure we're an array of values
      values = [].concat(values)

      ## blow up if any member of the subject
      ## isnt a checkbox or radio
      subject.each (index, el) =>
        el = $(el)
        node = Cypress.Utils.stringifyElement(el)

        if not el.is(":checkbox,:radio")
          word = Cypress.Utils.plural(subject, "contains", "is")
          @throwErr(".check() can only be called on :checkbox and :radio! Your subject #{word} a: #{node}")

        return if el.prop("checked")

        ## if we didnt pass in any values or our
        ## el's value is in the array then check it
        if not values.length or el.val() in values
          el.prop("checked", true).trigger("change")

    uncheck: (subject, values = []) ->
      @ensureDom(subject)

      ## make sure we're an array of values
      values = [].concat(values)

      ## blow up if any member of the subject
      ## isnt a checkbox
      subject.each (index, el) =>
        el = $(el)
        node = Cypress.Utils.stringifyElement(el)

        if not el.is(":checkbox")
          word = Cypress.Utils.plural(subject, "contains", "is")
          @throwErr(".uncheck() can only be called on :checkbox! Your subject #{word} a: #{node}")

        return if not el.prop("checked")

        ## if we didnt pass in any values or our
        ## el's value is in the array then check it
        if not values.length or el.val() in values
          el.prop("checked", false).trigger("change")

    click: (subject) ->
      @ensureDom(subject)

      click = (memo, el, index) =>
        wait = if $(el).is("a") then 50 else 10

        memo.then =>
          el.click()

          ## we want to add this wait delta to our
          ## runnables timeout so we prevent it from
          ## timing out from multiple clicks
          @_timeout(wait, true)

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        .delay(wait)

      ## create a new promise and chain off of it using reduce to insert
      ## the artificial delays.  we have to set this as cancellable for it
      ## to propogate since this is an "inner" promise
      clicks = _.reduce subject.toArray(), click, Promise.resolve().cancellable()

      ## return our original subject when our promise resolves
      clicks.return(subject)

      ## -- this does not work but may work in the future -- ##
      # Promise
      #   .each subject.toArray(), click
      #   .return(subject)

    type: (subject, sequence, options = {}) ->
      @ensureDom(subject)

      ## allow the el we're typing into to be
      ## changed by options
      ## why are we setting options.el??
      _.defaults options,
        el: subject

      if not subject.is("textarea,:text")
        node = Cypress.Utils.stringifyElement(options.el)
        @throwErr(".type() can only be called on textarea or :text! Your subject is a: #{node}")

      if (num = subject.length) and num > 1
        @throwErr(".type() can only be called on a single textarea or :text! Your subject contained #{num} elements!")

      options.sequence = sequence

      options.el.simulate "key-sequence", options

      Cypress.log
        $el: options.el
        onConsole: ->
          "Command": "type"
          "Typed": sequence
          "Applied To": options.el

      return subject

    clear: (subject, options = {}) ->
      ## what about other types of inputs besides just text?
      ## what about the new HTML5 ones?

      @ensureDom(subject)

      ## blow up if any member of the subject
      ## isnt a textarea or :text
      subject.each (index, el) =>
        el = $(el)
        node = Cypress.Utils.stringifyElement(el)

        if not el.is("textarea,:text")
          word = Cypress.Utils.plural(subject, "contains", "is")
          @throwErr(".clear() can only be called on textarea or :text! Your subject #{word} a: #{node}")

        @sync.type("{selectall}{del}", {el: el})

    select: (subject, valueOrText, options = {}) ->
      @ensureDom(subject)

      ## if @_subject() is a <select> el assume we are filtering down its
      ## options to a specific option first by value and then by text
      ## we'll throw if more than one is found AND the select
      ## element is multiple=multiple

      ## if the subject isn't a <select> then we'll check to make sure
      ## this is an option
      ## if this is multiple=multiple then we'll accept an array of values
      ## or texts and clear the previous selections which matches jQuery's
      ## behavior

      if not subject.is("select")
        node = Cypress.Utils.stringifyElement(subject)
        @throwErr ".select() can only be called on a <select>! Your subject is a: #{node}"

      if (num = subject.length) and num > 1
        @throwErr ".select() can only be called on a single <select>! Your subject contained #{num} elements!"

      ## normalize valueOrText if its not an array
      valueOrText = [].concat(valueOrText)
      multiple    = subject.prop("multiple")

      ## throw if we're not a multiple select and we've
      ## passed an array of values
      if not multiple and valueOrText.length > 1
        @throwErr ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"

      values  = []
      options = subject.children().map (index, el) ->
        ## push the value in values array if its
        ## found within the valueOrText
        value = el.value
        values.push(value) if value in valueOrText

        ## return the elements text + value
        {
          value: value
          text: $(el).text()
        }

      ## if we couldn't find anything by value then attempt
      ## to find it by text and insert its value into values arr
      if not values.length
        _.each options.get(), (obj, index) ->
          values.push(obj.value) if obj.text in valueOrText

      ## if we didnt set multiple to true and
      ## we have more than 1 option to set then blow up
      if not multiple and values.length > 1
        @throwErr(".select() matched than one option by value or text: #{valueOrText.join(", ")}")

      subject.val(values)

      ## yup manually create this change event
      ## 1.6.5. HTML event types
      ## scroll down the 'change'
      event = document.createEvent("HTMLEvents")
      event.initEvent("change", true, false)

      subject.get(0).dispatchEvent(event)

      return subject
