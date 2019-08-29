describe "config", ->

  ## this test ensures that defaultCommandTimeout should
  ## lower from the default '4000' to '1000' thus causing
  ## this test to bomb
  it "times out looking for a missing element", ->
    append = (id) ->
      $el = Cypress.$("<span id='#{id}'>#{id}<span>")

      setTimeout ->
        ## append the element after 2000ms
        Cypress.$("body").append($el)
      , 2000

    cy
      .visit("/index.html")

      ## this first time around this should pass
      ## which covers the situation of us just fucking
      ## up writing this spec
      .then ->
        append("foo")

      ## this should pass
      .get("#foo", {timeout: 4000})

      .then ->
        append("bar")

      .get("#bar") ## this should fail
