do ($Cypress, _, $) ->

  fixedOrAbsoluteRe = /(fixed|absolute)/

  $.expr.filters.hidden = (elem) ->
    $elem = $(elem)

    ## in Cypress-land we consider the element hidden if
    ## either its offsetHeight or offsetWidth is 0 because
    ## it is impossible for the user to interact with this element
    ## offsetHeight / offsetWidth includes the ef
    elHasNoOffsetWidthOrHeight($elem) or

      ## additionally if the effective visibility of the element
      ## is hidden (which includes any parent nodes) then the user
      ## cannot interact with this element and thus it is hidden
      $elem.css("visibility") is "hidden" or

        ## we do some calculations taking into account the parents
        ## to see if its hidden by a parent
        elementIsHiddenByAncestors($elem)

  elHasNoOffsetWidthOrHeight = ($el) ->
    el = $el[0]

    el.offsetWidth <= 0 or el.offsetHeight <= 0

  elDescendentsHavePositionFixedOrAbsolute = ($parent, $child) ->
    ## create an array of all elements between $parent and $child
    ## including child but excluding parent
    ## and check if these have position fixed|absolute
    $els = $child.parentsUntil($parent).add($child)

    _.any $els.get(), (el) ->
      fixedOrAbsoluteRe.test $(el).css("position")

  elementIsHiddenByAncestors = ($el, $origEl) ->
    ## store the original $el
    $origEl ?= $el

    ## walk up to each parent until we reach the body
    ## if any parent has an effective offsetHeight of 0
    ## and its set overflow: hidden then our child element
    ## is effectively hidden
    ## -----UNLESS------
    ## the parent or a descendent has position: absolute|fixed
    $parent = $el.parent()

    ## stop if we've reached the body or html
    ## in case there is no body
    return false if $parent.is("body,html")

    if $parent.css("overflow") is "hidden" and elHasNoOffsetWidthOrHeight($parent)
      ## if any of the elements between the parent and origEl
      ## have fixed or position absolute
      if elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)
        ## then they are not hidden
        return false
      else
        ## else they are
        return true

    ## continue to recursively walk up the chain until we reach body or html
    elementIsHiddenByAncestors($parent, $origEl)

  remoteJQueryisNotSameAsGlobal = (remoteJQuery) ->
    remoteJQuery and (remoteJQuery isnt $)

  $Cypress.Cy.extend
    getRemotejQueryInstance: (subject) ->
      remoteJQuery = @_getRemoteJQuery()
      if $Cypress.Utils.hasElement(subject) and remoteJQueryisNotSameAsGlobal(remoteJQuery)
        remoteSubject = remoteJQuery(subject)
        $Cypress.Utils.setCypressNamespace(remoteSubject, subject)

        return remoteSubject

    _getRemoteJQuery: ->
      if opt = @Cypress.option("jQuery")
        return opt
      else
        @private("window").$