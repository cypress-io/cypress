do ($Cypress, _, $) ->

  $.expr.filters.hidden = (elem) ->
    $elem = $(elem)

    ## in Cypress-land we consider the element hidden if
    ## either its offsetHeight or offsetWidth is 0 because
    ## it is impossible for the user to interact with this element
    ## offsetHeight / offsetWidth includes the ef
    (elem.offsetHeight <= 0 or elem.offsetWidth <= 0) or

      ## additionally if the effective visibility of the element
      ## is hidden (which includes any parent nodes) then the user
      ## cannot interact with this element and thus it is hidden
      $elem.css("visibility") is "hidden" or

        ## we do some calculations taking into account the parents
        ## to see if its hidden by a parent
        elementIsHiddenByAncestors($elem)

  elementIsHiddenByAncestors = ($el) ->
    ## walk up to each parent until we reach the body
    ## if any parent has an effective offsetHeight of 0
    ## and its set overflow: hidden then our child element
    ## is effectively hidden
    ## -----UNLESS------
    ## the parent or a descendent has position: absolute|fixed

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