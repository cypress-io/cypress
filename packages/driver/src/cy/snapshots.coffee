path = require("path")
url = require("url")
_ = require("lodash")
$ = require("jquery")

anyUrlInCssRe = /url\((['"])([^'"]*)\1\)/gm
HIGHLIGHT_ATTR = "data-cypress-el"

reduceText = (arr, fn) ->
  _.reduce arr, ((memo, item) -> memo += fn(item)), ""

getCssRulesString = (stylesheet) ->
  ## some browsers may throw a SecurityError if the stylesheet is cross-domain
  ## https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet#Notes
  ## for others, it will just be null
  try
    if rules = stylesheet.rules or stylesheet.cssRules
      reduceText rules, (rule) -> rule.cssText
    else
      null
  catch e
    null

screenStylesheetRe = /(screen|all)/

isScreenStylesheet = (stylesheet) ->
  media = stylesheet.getAttribute("media")
  return not _.isString(media) or screenStylesheetRe.test(media)

getStylesFor = (doc, $$, stylesheets, location) ->
  styles = $$(location).find("link[rel='stylesheet'],style")
  styles = _.filter(styles, isScreenStylesheet)

  _.map styles, (stylesheet) =>
    ## in cases where we can get the CSS as a string, make the paths
    ## absolute so that when they're restored by appending them to the page
    ## in <style> tags, background images and fonts still properly load
    if stylesheet.href
      ## if there's an href, it's a link tag
      ## return the CSS rules as a string, or, if cross-domain,
      ## a reference to the stylesheet's href
      makePathsAbsoluteToStylesheet(
        getCssRulesString(stylesheets[stylesheet.href]),
        stylesheet.href
      ) or {
        href: stylesheet.href
      }
    else
      ## otherwise, it's a style tag, and we can just grab its content
      styleRules = if stylesheet.sheet
      then Array.prototype.slice.call(stylesheet.sheet.cssRules).map((rule) -> rule.cssText).join("")
      else $$(stylesheet).text()

      makePathsAbsoluteToDoc(doc, styleRules)

getDocumentStylesheets = (document) ->
  _.reduce document.styleSheets, (memo, stylesheet) ->
    memo[stylesheet.href] = stylesheet
    return memo
  , {}

makePathsAbsoluteToStylesheet = (styles, stylesheetHref) ->
  return styles if not _.isString(styles)

  stylesheetPath = stylesheetHref.replace(path.basename(stylesheetHref), '')
  styles.replace anyUrlInCssRe, (_1, _2, filePath) ->
    absPath = url.resolve(stylesheetPath, filePath)
    return "url('#{absPath}')"

makePathsAbsoluteToDoc = (doc, styles) ->
  return styles if not _.isString(styles)

  styles.replace anyUrlInCssRe, (_1, _2, filePath) ->
    ## the href getter will always resolve an absolute path taking into
    ## account things like the current URL and the <base> tag
    a = doc.createElement("a")
    a.href = filePath
    return "url('#{a.href}')"

create = ($$, state) ->
  getStyles = ->
    doc = state("document")
    stylesheets = getDocumentStylesheets(doc)

    return {
      headStyles: getStylesFor(doc, $$, stylesheets, "head")
      bodyStyles: getStylesFor(doc, $$, stylesheets, "body")
    }

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
      $placeholder[0].src = "data:text/html;charset=utf-8,#{encodeURI(contents)}"

  createSnapshot = ($el) ->
    ## create a unique selector for this el
    $el.attr(HIGHLIGHT_ATTR, true) if $el?.attr

    ## TODO: throw error here if cy is undefined!

    body = $$("body").clone()

    ## for the head and body, get an array of all CSS,
    ## whether it's links or style tags
    ## if it's same-origin, it will get the actual styles as a string
    ## it it's cross-domain, it will get a reference to the link's href
    {headStyles, bodyStyles} = getStyles()

    ## replaces iframes with placeholders
    replaceIframes(body)

    ## remove tags we don't want in body
    body.find("script,link[rel='stylesheet'],style").remove()

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
    $el.removeAttr(HIGHLIGHT_ATTR) if $el?.removeAttr

    tmpHtmlEl = document.createElement("html")

    ## preserve attributes on the <html> tag
    htmlAttrs = _.reduce $$("html")[0].attributes, (memo, attr) ->
      if attr.specified
        try
          ## if we can successfully set the attribute
          ## then set it on memo because its possible
          ## the attribute is completely invalid
          tmpHtmlEl.setAttribute(attr.name, attr.value)
          memo[attr.name] = attr.value

      memo
    , {}

    return {body, htmlAttrs, headStyles, bodyStyles}

  return {
    createSnapshot

    ## careful renaming or removing this method, the runner depends on it
    getStyles
  }

module.exports = {
  HIGHLIGHT_ATTR

  create
}
