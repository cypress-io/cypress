## attach to Eclectus global
Eclectus.Dom = do ($, _) ->

  ## create a reusable jquery selector object for our iframes
  ## which utilitizes our parent jquery object with the iframe
  ## context.  this means our consumers dont have to have jquery
  ## included in their project, and any modifications they make
  ## to jquery will not affect our own internal use of it
  class Dom
    constructor: (@document) ->

    $: (selector) ->
      new $.fn.init(selector, @document)

  return Dom