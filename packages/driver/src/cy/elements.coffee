_ = require("lodash")
$ = require("jquery")

$utils = require("../cypress/utils")

create = (state) ->
  return {
    isInDom: ($el) ->
      doc = state("document")

      contains = (el) ->
        $.contains(doc, el)

      if $utils.hasDocument($el)
        ## change $el to be the root
        ## document element
        $el = $el.documentElement

      ## either see if the raw element itself
      ## is contained in the document
      if _.isElement($el)
        contains($el)
      else
        return false if $el.length is 0

        ## or all the elements in the collection
        _.every $el.toArray(), contains
  }

module.exports = {
  create
}
