_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$dom = require("../../dom")
$utils = require("../../cypress/utils")

$expr = $.expr[":"]

$contains = $expr.contains

restoreContains = ->
  $expr.contains = $contains

module.exports = (Commands, Cypress, cy, state, config) ->
  ## restore initially when a run starts
  restoreContains()

  ## restore before each test and whenever we stop
  Cypress.on("test:before:run", restoreContains)
  Cypress.on("stop", restoreContains)

  Commands.addAll({
    focused: (options = {}) ->
      _.defaults(options, {
        verify: true
        log: true
      })

      if options.log
        options._log = Cypress.log()

      log = ($el) ->
        return if options.log is false

        options._log.set({
          $el: $el
          consoleProps: ->
            ret = if $el
              $dom.getElements($el)
            else
              "--nothing--"
            Yielded: ret
            Elements: $el?.length ? 0
        })

      getFocused = ->
        focused = cy.getFocused()
        log(focused)

        return focused

      do resolveFocused = (failedByNonAssertion = false) ->
        Promise
        .try(getFocused)
        .then ($el) ->
          if options.verify is false
            return $el

          if not $el
            $el = $dom.wrap(null)
            $el.selector = "focused"

          ## pass in a null jquery object for assertions
          cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveFocused
          })

    get: (selector, options = {}) ->
      ctx = @
      
      if options is null or Array.isArray(options) or typeof options isnt 'object' then return $utils.throwErrByPath "get.invalid_options", {
          args: { options  }
      }
      _.defaults(options, {
        retry: true
        withinSubject: cy.state("withinSubject")
        log: true
        command: null
        verify: true
      })

      consoleProps = {}
      start = (aliasType) ->
        return if options.log is false

        options._log ?= Cypress.log
          message: selector
          referencesAlias: if aliasObj?.alias then {name: aliasObj.alias}
          aliasType: aliasType
          consoleProps: -> consoleProps

      log = (value, aliasType = "dom") ->
        return if options.log is false

        start(aliasType) if not _.isObject(options._log)

        obj = {}

        if aliasType is "dom"
          _.extend(obj, {
            $el: value
            numRetries: options._retries
          })

        obj.consoleProps = ->
          key = if aliasObj then "Alias" else "Selector"
          consoleProps[key] = selector

          switch aliasType
            when "dom"
              _.extend(consoleProps, {
                Yielded: $dom.getElements(value)
                Elements: value?.length
              })

            when "primitive"
              _.extend(consoleProps, {
                Yielded: value
              })

            when "route"
              _.extend(consoleProps, {
                Yielded: value
              })

          return consoleProps

        options._log.set(obj)

      ## We want to strip everything after the last '.'
      ## only when it is potentially a number or 'all'
      if _.indexOf(selector, ".") == -1 ||
      selector.slice(1) in _.keys(cy.state("aliases"))
        toSelect = selector
      else
         allParts = _.split(selector, '.')
         toSelect = _.join(_.dropRight(allParts, 1), '.')

      if aliasObj = cy.getAlias(toSelect)
        {subject, alias, command} = aliasObj

        return do resolveAlias = ->
          switch
            ## if this is a DOM element
            when $dom.isElement(subject)
              replayFrom = false

              replay = ->
                cy.replayCommandsFrom(command)

                ## its important to return undefined
                ## here else we trick cypress into thinking
                ## we have a promise violation
                return undefined

              ## if we're missing any element
              ## within our subject then filter out
              ## anything not currently in the DOM
              if $dom.isDetached(subject)
                subject = subject.filter (index, el) ->
                  $dom.isAttached(el)

                ## if we have nothing left
                ## just go replay the commands
                if not subject.length
                  return replay()

              log(subject)

              return cy.verifyUpcomingAssertions(subject, options, {
                onFail: (err) ->
                  ## if we are failing because our aliased elements
                  ## are less than what is expected then we know we
                  ## need to requery for them and can thus replay
                  ## the commands leading up to the alias
                  if err.type is "length" and err.actual < err.expected
                    replayFrom = true
                onRetry: ->
                  if replayFrom
                    replay()
                  else
                    resolveAlias()
              })

            ## if this is a route command
            when command.get("name") is "route"
              if !(_.indexOf(selector, ".") == -1 ||
              selector.slice(1) in _.keys(cy.state("aliases")))
                allParts = _.split(selector, ".")
                index = _.last(allParts)
                alias = _.join([alias, index], ".")
              requests = cy.getRequestsByAlias(alias) ? null
              log(requests, "route")
              return requests
            else
              ## log as primitive
              log(subject, "primitive")

              do verifyAssertions = =>
                cy.verifyUpcomingAssertions(subject, options, {
                  ensureExistenceFor: false
                  onRetry: verifyAssertions
                })

      start("dom")

      setEl = ($el) ->
        return if options.log is false

        consoleProps.Yielded = $dom.getElements($el)
        consoleProps.Elements = $el?.length

        options._log.set({$el: $el})

      getElements = ->
        ## attempt to query for the elements by withinSubject context
        ## and catch any sizzle errors!
        try
          $el = cy.$$(selector, options.withinSubject)
        catch e
          e.onFail = -> if options.log is false then e else options._log.error(e)
          throw e

        ## if that didnt find anything and we have a within subject
        ## and we have been explictly told to filter
        ## then just attempt to filter out elements from our within subject
        if not $el.length and options.withinSubject and options.filter
          filtered = options.withinSubject.filter(selector)

          ## reset $el if this found anything
          $el = filtered if filtered.length

        ## store the $el now in case we fail
        setEl($el)

        ## allow retry to be a function which we ensure
        ## returns truthy before returning its
        if _.isFunction(options.onRetry)
          if ret = options.onRetry.call(ctx, $el)
            log($el)
            return ret
        else
          log($el)
          return $el

      do resolveElements = ->
        Promise.try(getElements).then ($el) ->
          if options.verify is false
            return $el

          cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements
          })

    root: (options = {}) ->
      _.defaults options, {log: true}

      if options.log isnt false
        options._log = Cypress.log({message: ""})

      log = ($el) ->
        options._log.set({$el: $el}) if options.log

        return $el

      if withinSubject = cy.state("withinSubject")
        return log(withinSubject)

      cy.now("get", "html", {log: false}).then(log)
  })

  Commands.addAll({ prevSubject: ["optional", "window", "document", "element"] }, {
    contains: (subject, filter, text, options = {}) ->
      ## nuke our subject if its present but not an element.
      ## in these cases its either window or document but
      ## we dont care.
      ## we'll null out the subject so it will show up as a parent
      ## command since its behavior is identical to using it
      ## as a parent command: cy.contains()
      if subject and not $dom.isElement(subject)
        subject = null

      switch
        ## .contains(filter, text)
        when _.isRegExp(text)
          text = text
          filter = filter
        ## .contains(text, options)
        when _.isObject(text)
          options = text
          text = filter
          filter = ""
        ## .contains(text)
        when _.isUndefined(text)
          text = filter
          filter = ""

      _.defaults options, {log: true}

      $utils.throwErrByPath "contains.invalid_argument" if not (_.isString(text) or _.isFinite(text) or _.isRegExp(text))
      $utils.throwErrByPath "contains.empty_string" if _.isBlank(text)

      getPhrase = (type, negated) ->
        switch
          when filter and subject
            node = $dom.stringify(subject, "short")
            "within the element: #{node} and with the selector: '#{filter}' "
          when filter
            "within the selector: '#{filter}' "
          when subject
            node = $dom.stringify(subject, "short")
            "within the element: #{node} "
          else
            ""

      getErr = (err) ->
        {type, negated, node} = err

        switch type
          when "existence"
            if negated
              "Expected not to find content: '#{text}' #{getPhrase(type, negated)}but continuously found it."
            else
              "Expected to find content: '#{text}' #{getPhrase(type, negated)}but never did."

      if options.log isnt false
        consoleProps = {
          Content: text
          "Applied To": $dom.getElements(subject or cy.state("withinSubject"))
        }

        options._log = Cypress.log
          message: _.compact([filter, text])
          type: if subject then "child" else "parent"
          consoleProps: -> consoleProps

      setEl = ($el) ->
        return if options.log is false

        consoleProps.Yielded = $dom.getElements($el)
        consoleProps.Elements = $el?.length

        options._log.set({$el: $el})

      if _.isRegExp(text)
        $expr.contains = (elem) ->
          ## taken from jquery's normal contains method
          text.test(elem.textContent or elem.innerText or $.text(elem))

      ## find elements by the :contains psuedo selector
      ## and any submit inputs with the attributeContainsWord selector
      selector = $dom.getContainsSelector(text, filter)

      checkToAutomaticallyRetry = (count, $el) ->
        ## we should automatically retry querying
        ## if we did not have any upcoming assertions
        ## and our $el's length was 0, because that means
        ## the element didnt exist in the DOM and the user
        ## did not explicitly request that it does not exist
        return if count isnt 0 or ($el and $el.length)

        ## throw here to cause the .catch to trigger
        throw new Error()

      resolveElements = ->
        getOpts = _.extend(_.clone(options), {
          # error: getErr(text, phrase)
          withinSubject: subject or cy.state("withinSubject") or cy.$$("body")
          filter: true
          log: false
          # retry: false ## dont retry because we perform our own element validation
          verify: false ## dont verify upcoming assertions, we do that ourselves
        })

        cy.now("get", selector, getOpts).then ($el) ->
          if $el and $el.length
            $el = $dom.getFirstDeepestElement($el)

          setEl($el)

          cy.verifyUpcomingAssertions($el, options, {
            onRetry: resolveElements
            onFail: (err) ->
              switch err.type
                when "length"
                  if err.expected > 1
                    $utils.throwErrByPath "contains.length_option", { onFail: options._log }
                when "existence"
                  err.displayMessage = getErr(err)
          })

      Promise
      .try(resolveElements)
      .finally ->
        ## always restore contains in case
        ## we used a regexp!
        restoreContains()
  })

  Commands.addAll({ prevSubject: "element" }, {
    within: (subject, options, fn) ->
      ctx = @

      if _.isUndefined(fn)
        fn = options
        options = {}

      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.log({
          $el: subject
          message: ""
        })

      $utils.throwErrByPath("within.invalid_argument", { onFail: options._log }) if not _.isFunction(fn)

      ## reference the next command after this
      ## within.  when that command runs we'll
      ## know to remove withinSubject
      next = cy.state("current").get("next")

      ## backup the current withinSubject
      ## this prevents a bug where we null out
      ## withinSubject when there are nested .withins()
      ## we want the inner within to restore the outer
      ## once its done
      prevWithinSubject = cy.state("withinSubject")
      cy.state("withinSubject", subject)

      fn.call(ctx, subject)

      cleanup = ->
        cy.removeListener("command:start", setWithinSubject)

      ## we need a mechanism to know when we should remove
      ## our withinSubject so we dont accidentally keep it
      ## around after the within callback is done executing
      ## so when each command starts, check to see if this
      ## is the command which references our 'next' and
      ## if so, remove the within subject
      setWithinSubject = (obj) ->
        return if obj isnt next

        ## okay so what we're doing here is creating a property
        ## which stores the 'next' command which will reset the
        ## withinSubject.  If two 'within' commands reference the
        ## exact same 'next' command, then this prevents accidentally
        ## resetting withinSubject more than once.  If they point
        ## to differnet 'next's then its okay
        if next isnt cy.state("nextWithinSubject")
          cy.state("withinSubject", prevWithinSubject or null)
          cy.state("nextWithinSubject", next)

        ## regardless nuke this listeners
        cleanup()

      ## if next is defined then we know we'll eventually
      ## unbind these listeners
      if next
        cy.on("command:start", setWithinSubject)
      else
        ## remove our listener if we happen to reach the end
        ## event which will finalize cleanup if there was no next obj
        cy.once "command:queue:before:end", ->
          cleanup()

          cy.state("withinSubject", null)

      return subject
  })