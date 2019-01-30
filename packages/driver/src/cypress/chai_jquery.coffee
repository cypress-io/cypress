_ = require("lodash")
$ = require("jquery")
$dom = require("../dom")

selectors = {
  visible: "visible"
  hidden: "hidden"
  selected: "selected"
  checked: "checked"
  enabled: "enabled"
  disabled: "disabled"
  focus: "focused"
  focused: "focused"
}

attrs = {
  attr: "attribute"
  css: "CSS property"
  prop: "property"
}

wrap = (ctx) ->
  ## reset the obj under test
  ## to be re-wrapped in our own
  ## jquery, so we can control
  ## the methods on it
  $(ctx._obj)

$chaiJquery = (chai, chaiUtils, callbacks = {}) ->
  { inspect, flag } = chaiUtils

  assertDom = (ctx, method, args...) ->
    if not ($dom.isDom(ctx._obj) or $dom.isJquery(ctx._obj))
      try
        ## always fail the assertion
        ## if we aren't a DOM like object
        ## depends on "negate" flag
        ctx.assert(!!ctx.__flags.negate, args...)
      catch err
        callbacks.onInvalid(method, ctx._obj)

  assert = (ctx, method, bool, args...) ->
    assertDom(ctx, method, args...)
    try
      # ## reset obj to wrapped
      orig = ctx._obj
      ctx._obj = wrap(ctx)

      if ctx._obj.length is 0
        ctx._obj = ctx._obj.selector

      ## apply the assertion
      ctx.assert(bool, args...)
      ctx._obj = orig
    catch err
      ## send it up with the obj and whether it was negated
      callbacks.onError(err, method, ctx._obj, flag(ctx, "negate"))

  assertParial = (ctx, method, actual, expected, message, notMessage, args...) ->
    if ctx.__flags.includes or ctx.__flags.contains
      return assert(
        ctx
        method
        _.includes(actual, expected),
        'expected #{this}'+ ' to contain ' + message
        'expected #{this}'+ ' not to contain ' + notMessage
        args...
      )
    return assert(
      ctx
      method
      actual is expected
      'expected #{this}'+ ' to have ' + message
      'expected #{this}'+ ' not to have ' + notMessage
      args...
    )
  chai.Assertion.addMethod "data", ->
    assertDom(@, "data")

    a = new chai.Assertion(wrap(@).data())

    if flag(@, "negate")
      a = a.not

    a.property.apply(a, arguments)

  chai.Assertion.addMethod "class", (className) ->
    assert(
      @,
      "class",
      wrap(@).hasClass(className),
      'expected #{this} to have class #{exp}',
      'expected #{this} not to have class #{exp}',
      className
    )

  chai.Assertion.addMethod "id", (id) ->
    assertParial(
      @,
      "id",
      wrap(@).prop("id"),
      id,
      'id #{exp}',
      'id #{exp}',
      id
    )

  chai.Assertion.addMethod "html", (html) ->
    assertDom(
      @,
      "html",
      'expected #{this} to have HTML #{exp}',
      'expected #{this} not to have HTML #{exp}',
      html
    )

    actual = wrap(@).html()

    assertParial(
      @,
      "html",
      actual
      html
      'HTML #{exp}, but the HTML was #{act}',
      'HTML #{exp}',
      html,
      actual
    )

  chai.Assertion.addMethod "text", (text) ->
    assertDom(
      @,
      "text",
      'expected #{this} to have text #{exp}',
      'expected #{this} not to have text #{exp}',
      text
    )

    actual = wrap(@).text()

    assertParial(
      @,
      "text",
      actual
      text
      'text #{exp}, but the text was #{act}',
      'text #{exp}',
      text,
      actual
    )

  chai.Assertion.addMethod "value", (value) ->
    assertDom(
      @,
      "value",
      'expected #{this} to have value #{exp}',
      'expected #{this} not to have value #{exp}',
      value
    )

    actual = wrap(@).val()

    assertParial(
      @,
      "value",
      actual
      value
      'value #{exp}, but the value was #{act}',
      'value #{exp}',
      value,
      actual
    )

  chai.Assertion.addMethod "descendants", (selector) ->
    assert(
      @,
      "descendants",
      wrap(@).has(selector).length > 0,
      'expected #{this} to have descendants #{exp}',
      'expected #{this} not to have descendants #{exp}',
      selector
    )

  chai.Assertion.overwriteProperty "empty", (_super) ->
    return ->
      if $dom.isDom(@_obj)
        assert(
          @,
          "empty",
          wrap(@).is(":empty"),
          'expected #{this} to be #{exp}',
          'expected #{this} not to be #{exp}',
          "empty"
        )
      else
        _super.apply(@, arguments)

  chai.Assertion.overwriteMethod "match", (_super) ->
    return (selector) ->
      if $dom.isDom(@_obj)
        assert(
          @,
          "match",
          wrap(@).is(selector),
          'expected #{this} to match #{exp}',
          'expected #{this} not to match #{exp}',
          selector
        )
      else
        _super.apply(@, arguments)

  _.each selectors, (selectorName, selector) ->
    chai.Assertion.addProperty selector, ->
      assert(
        @,
        selector,
        wrap(@).is(":" + selector),
        'expected #{this} to be #{exp}',
        'expected #{this} not to be #{exp}',
        selectorName
      )

  _.each attrs, (description, attr) ->
    chai.Assertion.addMethod attr, (name, val) ->
      assertDom(
        @,
        attr,
        'expected #{this} to have ' + description + ' #{exp}',
        'expected #{this} not to have ' + description + ' #{exp}',
        name
      )

      actual = wrap(@)[attr](name)

      ## when we only have 1 argument dont worry about val
      if arguments.length is 1
        assert(
          @,
          attr,
          actual != undefined,
          'expected #{this} to have ' + description + ' #{exp}',
          'expected #{this} not to have ' + description + ' #{exp}',
          name
        )

        ## change the subject
        @_obj = actual

      else
        ## if we don't have an attribute here at all we need to
        ## have a different failure message
        if _.isUndefined(actual)
          message = "expected \#{this} to have #{description} #{inspect(name)}"

          negatedMessage = "expected \#{this} not to have #{description} #{inspect(name)}"
        else
          message = "expected \#{this} to have #{description} #{inspect(name)} with the value \#{exp}, but the value was \#{act}"

          negatedMessage = "expected \#{this} not to have #{description} #{inspect(name)} with the value \#{exp}, but the value was \#{act}"

        assert(
          @,
          attr,
          actual? and actual is val,
          message,
          negatedMessage,
          val,
          actual
        )

      return @

module.exports = $chaiJquery
