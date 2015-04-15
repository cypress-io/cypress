do ($Cypress, _) ->

  $Cypress.extend
    highlightAttr: "data-cypress-el"

    createSnapshot: ($el) ->
      ## create a unique selector for this el
      $el.attr(@highlightAttr, true) if $el?.attr

      ## throw error here if @cy is undefined!

      ## clone the body and strip out any script tags
      body = @cy.$("body").clone()
      body.find("script").remove()

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

      return body