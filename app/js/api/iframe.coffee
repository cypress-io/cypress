do (parent = window.opener or window.parent) ->
  ## proxy Ecl from the parent
  window.Ecl = parent.Ecl

  ## proxy jQuery from the parent
  ## dont rely on our iframe having jQuery otherwise
  $ = parent.$

  ## proxy chai from our parent
  window.chai   = parent.chai
  window.expect = chai.expect
  window.should = chai.should()
  window.assert = chai.assert

  ## create our own mocha objects from our parents if its not already defined
  window.Mocha = parent.Mocha
  window.mocha = parent.mocha

  ## remove all of the listeners from the previous root suite
  mocha.suite.removeAllListeners()

  ## We clone the outermost root level suite - and replace
  ## the existing root suite with a new one. this wipes out
  ## all references to hooks / tests / suites and thus
  ## prevents holding reference to old suites / tests
  mocha.suite = mocha.suite.clone()

  ## Override mocha.ui so that the pre-require event is emitted
  ## with the iframe's `window` reference, rather than the parent's.
  mocha.ui = (name) ->
    @_ui = Mocha.interfaces[name]
    throw new Error('invalid interface "' + name + '"') if not @_ui
    @_ui = @_ui(@suite)
    @suite.emit 'pre-require', window, null, @
    return @

  mocha.ui "bdd"