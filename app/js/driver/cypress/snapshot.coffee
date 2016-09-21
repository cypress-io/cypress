do ($Cypress, _) ->

  reduceText = (arr, fn) ->
    _.reduce arr, ((memo, item) -> memo += fn(item)), ""

  $Cypress.extend
    highlightAttr: "data-cypress-el"

    ## careful renaming or removing this method, the runner depends on it
    getStylesString: ->
      reduceText @cy.private("document").styleSheets, (stylesheet) ->
        ## TODO: when we support Firefox, it may throw a SecurityError
        ## if the stylesheets is cross-domain, so we need to handle that
        ## https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet#Notes
        reduceText stylesheet.cssRules, (rule) ->
          rule.cssText

    createSnapshot: ($el) ->
      ## create a unique selector for this el
      $el.attr(@highlightAttr, true) if $el?.attr

      ## TODO: throw error here if @cy is undefined!

      body = @cy.$$("body").clone()

      ## extract all CSS into a string
      styles = @getStylesString()

      ## remove tags we don't want in body
      body.find("script,iframe,link[rel='stylesheet'],style").remove()

      ## put all the extracted CSS in the body, because that's all
      ## that gets swapped out when restoring a snapshot
      body.append("<style>#{styles}</style>")

      ## here we need to figure out if we're in a remote manual environment
      ## if so we need to stringify the DOM:
      ## 1. grab all inputs / textareas / options and set their value on the element
      ## 2. convert DOM to string: body.prop("outerHTML")
      ## 3. send this string via websocket to our server
      ## 4. server rebroadcasts this to our client and its stored as a property

      ## its also possible for us to store the DOM string completely on the server
      ## without ever sending it back to the browser (until its requests).
      ## we could just store it in memory and wipe it out intelligently.
      ## this would also prevent having to store the DOM structure on the client,
      ## which would reduce memory, and some CPU operations

      ## now remove it after we clone
      $el.removeAttr(@highlightAttr) if $el?.removeAttr

      ## preserve classes on the <html> tag
      htmlClasses = @cy.$$("html")[0].className

      return {body, htmlClasses}
