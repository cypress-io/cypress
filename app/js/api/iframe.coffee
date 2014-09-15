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
  window.Mocha ?= Object.create(parent.Mocha)
  window.mocha ?= Object.create(parent.mocha)

  ## In order to isolate top-level before/beforeEach hooks,
  ## the specs in each iframe are wrapped in an anonymous suite.
  mocha.suite = Mocha.Suite.create(mocha.suite)

  ## Override mocha.ui so that the pre-require event is emitted
  ## with the iframe's `window` reference, rather than the parent's.
  mocha.ui = (name) ->
    @_ui = Mocha.interfaces[name]
    throw new Error('invalid interface "' + name + '"') if not @_ui
    @_ui = @_ui(@suite)
    @suite.emit 'pre-require', window, null, @
    return @

  mocha.ui "bdd"