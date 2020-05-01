_ = require("lodash")
$ = require("jquery")

$dom = require('../dom')
$SnapshotsCss = require("./snapshots_css")

HIGHLIGHT_ATTR = "data-cypress-el"

create = ($$, state) ->
  snapshotsCss = $SnapshotsCss.create($$, state)
  snapshotsMap = new WeakMap()

  getHtmlAttrs = (htmlEl) ->
    tmpHtmlEl = document.createElement("html")

    _.transform htmlEl?.attributes, (memo, attr) ->
      return if not attr.specified

      try
        ## if we can successfully set the attributethen set it on memo
        ## because it's possible the attribute is completely invalid
        tmpHtmlEl.setAttribute(attr.name, attr.value)
        memo[attr.name] = attr.value
    , {}

  replaceIframes = (body) ->
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

    $$("iframe").each (idx, iframe) =>
      $iframe = $(iframe)

      remove = ->
        $iframes.eq(idx).remove()

      ## if we don't have access to window
      ## then just remove this $iframe...
      try
        if not $iframe.prop("contentWindow")
          return remove()
      catch e
        return remove()

      props = {
        id: iframe.id
        class: iframe.className
        style: iframe.style.cssText
      }

      dimensions = (fn) ->
        ## jquery may throw here if we accidentally
        ## pass an old iframe reference where the
        ## document + window properties are unavailable
        try
          $iframe[fn]()
        catch e
          0

      $placeholder = $("<iframe />", props).css({
        background: "#f8f8f8"
        border: "solid 1px #a3a3a3"
        boxSizing: "border-box"
        padding: "20px"
        width: dimensions("outerWidth")
        height: dimensions("outerHeight")
      })

      $iframes.eq(idx).replaceWith($placeholder)
      contents = """
        <style>
          p { color: #888; font-family: sans-serif; line-height: 1.5; }
        </style>
        <p>&lt;iframe&gt; placeholder for #{iframe.src}</p>
      """
      $placeholder[0].src = "data:text/html;base64,#{window.btoa(contents)}"

  getStyles = (snapshot) ->
    styleIds = snapshotsMap.get(snapshot)

    return {} if not styleIds

    return {
      headStyles: snapshotsCss.getStylesByIds(styleIds.headStyleIds)
      bodyStyles: snapshotsCss.getStylesByIds(styleIds.bodyStyleIds)
    }

  detachDom = (iframeContents) ->
    { headStyleIds, bodyStyleIds } = snapshotsCss.getStyleIds()
    htmlAttrs = getHtmlAttrs(iframeContents.find('html')[0])
    $body = iframeContents.find('body')

    $body.find('script,link[rel="stylesheet"],style').remove()

    snapshot = {
      name: "final state"
      htmlAttrs
      body: $body.detach()
    }

    snapshotsMap.set(snapshot, { headStyleIds, bodyStyleIds })

    return snapshot

  createSnapshot = (name, $elToHighlight) ->
    ## create a unique selector for this el
    ## but only IF the subject is truly an element. For example
    ## we might be wrapping a primitive like "$([1, 2]).first()"
    ## which arrives here as number 1
    ## jQuery v2 allowed to silently try setting 1[HIGHLIGHT_ATTR] doing nothing
    ## jQuery v3 runs in strict mode and throws an error if you attempt to set a property

    ## TODO: in firefox sometimes this throws a cross-origin access error
    try
      isJqueryElement = $dom.isElement($elToHighlight) and $dom.isJquery($elToHighlight)

      if isJqueryElement
        $elToHighlight.attr(HIGHLIGHT_ATTR, true)

      ## TODO: throw error here if cy is undefined!
    
      $body = $$("body").clone()

      ## for the head and body, get an array of all CSS,
      ## whether it's links or style tags
      ## if it's same-origin, it will get the actual styles as a string
      ## it it's cross-domain, it will get a reference to the link's href
      { headStyleIds, bodyStyleIds } = snapshotsCss.getStyleIds()

      ## replaces iframes with placeholders
      replaceIframes($body)

      ## remove tags we don't want in body
      $body.find("script,link[rel='stylesheet'],style").remove()

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
      if isJqueryElement
        $elToHighlight.removeAttr(HIGHLIGHT_ATTR)

      ## preserve attributes on the <html> tag
      htmlAttrs = getHtmlAttrs($$("html")[0])

      snapshot = {
        name
        htmlAttrs
        body: $body
      }

      snapshotsMap.set(snapshot, { headStyleIds, bodyStyleIds })

      return snapshot

    catch e
      null

  return {
    createSnapshot

    detachDom

    getStyles

    onCssModified: snapshotsCss.onCssModified

    onBeforeWindowLoad: snapshotsCss.onBeforeWindowLoad
  }

module.exports = {
  HIGHLIGHT_ATTR

  create
}
