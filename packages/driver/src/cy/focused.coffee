$dom = require("../dom")

create = (state) ->
  return {
    getFocused: ->
      try
        { activeElement, body } = state("document")
        
        ## active element is the default if its null
        ## or its equal to document.body
        activeElementIsDefault = ->
          (not activeElement) or (activeElement is body)
        
        ## if activeElement is something other than the default
        ## we bail early and reset the force focused el.
        ## this can happen if the AUT steals focus
        ## programmatically by calling 
        ## HTMLElement::focus directly
        if activeElementIsDefault()
          return null
        
        return $dom.wrap(activeElement)
      catch
        return null
  }  
  
module.exports = {
  create
}
