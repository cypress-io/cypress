_ = require("lodash")

$utils = require("../cypress/utils")

validAliasApiRe = /^(\d+|all)$/

xhrNotWaitedOnByIndex = (state, alias, index, prop) ->
  ## find the last request or response
  ## which hasnt already been used.
  xhrs = state(prop) ? []

  xhrs = _.filter xhrs, { alias }

  ## allow us to handle waiting on both
  ## the request or the response part of the xhr
  privateProp = "_has#{prop}BeenWaitedOn"

  obj = xhrs[index]

  if obj and !obj[privateProp]
    obj[privateProp] = true
    return obj.xhr

create = (state) ->
  return {
    getIndexedXhrByAlias: (alias, index) ->
      allParts = _.split(alias, '.')
      if _.size(allParts) > 1
        [str, prop] = [_.join(_.dropRight(allParts, 1), '.'), _.last(allParts)]
      else
        [str, prop] = [alias, null]

      if prop
        if prop is "request"
          return xhrNotWaitedOnByIndex(state, str, index, "requests")
        else
          if prop isnt "response"
            $utils.throwErrByPath "wait.alias_invalid", {
              args: { prop, str }
            }

      xhrNotWaitedOnByIndex(state, str, index, "responses")

    getRequestsByAlias: (alias) ->
      console.log(alias)
      allParts = _.split(alias, '.')
      if _.size(allParts) > 1
        if alias in _.keys(cy.state("aliases"))
          [alias, prop] = [alias, null]
        else # potentially valid prop
          console.log("hello?")
          [alias, prop] = [_.join(_.dropRight(allParts, 1), '.'), _.last(allParts)]
      else
        [alias, prop] = [alias, null]

      console.log("getRequestsByAlias")
      console.log(allParts)
      console.log(_.keys(cy.state("aliases")))
      console.log(alias in _.keys(cy.state("aliases")))
      console.log([alias, prop])

      if prop and not validAliasApiRe.test(prop)
        $utils.throwErrByPath "get.alias_invalid", {
          args: { prop }
        }

      if prop is "0"
        $utils.throwErrByPath "get.alias_zero", {
          args: { alias }
        }

      ## return an array of xhrs
      matching = _
      .chain(state("responses"))
      .filter({ alias: alias })
      .map("xhr")
      .value()

      ## return the whole array if prop is all
      return matching if prop is "all"

      ## else if prop its a digit and we need to return
      ## the 1-based response from the array
      return matching[_.toNumber(prop) - 1] if prop

      ## else return the last matching response
      return _.last(matching)
  }


module.exports = {
  create
}
