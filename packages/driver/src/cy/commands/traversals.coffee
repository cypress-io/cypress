_ = require("lodash")

$dom = require("../../dom")

traversals = "find filter not children eq closest first last next nextAll nextUntil parent parents parentsUntil prev prevAll prevUntil siblings".split(" ")

module.exports = (Commands, Cypress, cy, state, config) ->
  _.each traversals, (traversal) ->
    Commands.add traversal, { prevSubject: "element" }, (subject, arg1, arg2, options) ->
      if _.isObject(arg1) and not _.isFunction(arg1)
        options = arg1

      if _.isObject(arg2) and not _.isFunction(arg2)
        options = arg2

      options ?= {}

      _.defaults options, {log: true}

      getSelector = ->
        args = _.chain([arg1, arg2]).reject(_.isFunction).reject(_.isObject).value()
        args = _.without(args, null, undefined)
        args.join(", ")

      consoleProps = {
        Selector: getSelector()
        "Applied To": $dom.getElements(subject)
      }

      if options.log isnt false
        options._log = Cypress.log
          message: getSelector()
          consoleProps: -> consoleProps

      setEl = ($el) ->
        return if options.log is false

        consoleProps.Yielded = $dom.getElements($el)
        consoleProps.Elements = $el?.length

        options._log.set({$el: $el})

      do getElements = ->
        ## catch sizzle errors here
        try
          $el = subject[traversal].call(subject, arg1, arg2)

          ## normalize the selector since jQuery won't have it
          ## or completely borks it
          $el.selector = getSelector()
        catch e
          e.onFail = -> options._log.error(e)
          throw e

        setEl($el)

        cy.verifyUpcomingAssertions($el, options, {
          onRetry: getElements
          onFail: (err) ->
            if err.type is "existence"
              node = $dom.stringify(subject, "short")
              err.message += " Queried from element: #{node}"
            })
