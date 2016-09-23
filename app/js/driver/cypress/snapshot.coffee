do ($Cypress, _) ->

  reduceText = (arr, fn) ->
    _.reduce arr, ((memo, item) -> memo += fn(item)), ""

  $Cypress.extend
    highlightAttr: "data-cypress-el"

    ## careful renaming or removing this method, the runner depends on it
    getStylesString: ->
      reduceText @cy.private("document").styleSheets, (stylesheet) ->
        ## some browsers may throw a SecurityError if the stylesheet is cross-domain
        ## https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet#Notes
        ## for others, it will just be null
        try
          reduceText stylesheet.cssRules, (rule) ->
            rule.cssText
        catch e
          return ""

    createSnapshot: ($el) ->
      ## create a unique selector for this el
      $el.attr(@highlightAttr, true) if $el?.attr

      ## TODO: throw error here if @cy is undefined!

      body = @cy.$$("body").clone()

      ## extract all CSS into a string
      styles = @getStylesString()

      ## replaces iframes with placeholders
      @_replaceIframes(body)

      ## remove tags we don't want in body
      body.find("script,link[rel='stylesheet'],style").remove()

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

    _replaceIframes: (body) ->
      ## remove iframes because we don't want extra requests made, JS run, etc
      ## when restoring a snapshot
      ## replace them so the lack of them doesn't cause layout issues
      ## use <iframe>s as the placeholders because iframes are inline, replaced
      ## elements (https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element)
      ## so it's hard to simulate their box model
      ## attach class names and inline styles, so that CSS styles are applied
      ## as they would be on the user's page, but override some
      ## styles so it looks like a placeholder

      ## need to only replace the iframes in the cloned body, so grab those
      $iframes = body.find("iframe")
      ## but query from the actual document, since the cloned body
      ## iframes don't have proper styles applied
      @cy.$$("iframe").each (idx, iframe) =>
        props = {
          id: iframe.id
          class: iframe.className
          style: iframe.style.cssText
        }

        $iframe = @cy.$$(iframe)
        $placeholder = @cy.$$("<iframe />", props).css({
          background: "#f8f8f8"
          border: "solid 1px #a3a3a3"
          boxSizing: "border-box"
          padding: "20px"
          width: $iframe.outerWidth()
          height: $iframe.outerHeight()
        })

        $iframes.eq(idx).replaceWith($placeholder)
        contents = """
          <style>
            p { color: #888; font-family: sans-serif; line-height: 1.5; }
          </style>
          <p>&lt;iframe&gt; placeholder for #{iframe.src}</p>
        """
        $placeholder[0].src = "data:text/html;charset=utf-8,#{encodeURI(contents)}"
