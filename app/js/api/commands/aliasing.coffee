do (Cypress, _) ->

  Cypress.addUtility

    as: (str) ->
      ## make sure the prev object is NOT a modifier

      ## throwErr if prev object is a modifier
      ## throwErr if prev object is undefined
      # @_aliases[str] = @prop("current").prev
      @_aliases[str] = {subject: @_subject(), command: @prop("current")}

      return @_subject()

    # cy
    #   .server()
    #   .route("/users", {}).as("u")
    #   .query("body").as("b")
    #   .query("div").find("span").find("input").as("i")
    #   .query("form").wait ($form) ->
    #     expect($form).to.contain("foo")
    #   .find("div").find("span:first").find("input").as("i2")
    #   .within "@b", ->
    #     cy.query("button").as("btn")

    # cy.get("div").notFind("input")
    # cy.get("body").not ->
      # cy.get("")
    # cy.not ->
      # cy.find("body")

    # cy.query("body")
    # cy.qc("foo bar baz")
    # cy.queryContaining("asdfasdf")
    # cy.get
    # cy.getContent("afwefe")

    ## how to handle NOT?

    ## notGet / notGetContent

    ## root commands start a chain over
    ## ignore any previous subjects, begins a new chain of commands
    ## server / route / get / getContent / within / withinContent
    ## title / url / location / window / document
    ## eval / visit / ng / clearLocalStorage

    ## chainable modifiers
    ## work off of existing subject and changes to new subject
    ## should modifiers go through the same retry logic as #get?
    ## containing / find / prev / next / eq / children / parent / parents / filter

    ## chainable actions
    ## work off of existing subject and returns the same subject
    ## check / uncheck / click / select / fill / drag / drop / type / clearLocalStorage

    ## chainable utilities
    ## work off of existing subject and can optionally return a new subject
    ## wait / until / as / not

    ## DIFFICULT ALIASING SCENARIOS
    ## 1. You have a row of 5 todos.  You alias the last row. You insert
    ## a new row.  Does alias point to the NEW last row or the existing one?

    ## 2. There is several action(s) to make up an element.  You click #add
    ## which pops up a form, and alias the form.  You fill out the form and
    ## click submit.  This clears the form.  You then use the form alias.  Does
    ## it repeat the several steps which created the form in the first place?
    ## does it simply say the referenced form cannot be found?

    ## IF AN ALIAS CAN BE FOUND
    ## cy.get("form").find("input[name='age']").as("age")
    ## cy.get("@age").type(28)
    ## GET 'form'
    ##   FIND 'input[name='age']'
    ##     AS 'age'
    ##
    ## GET '@age'
    ##   TYPE '28'
    ##
    ## IF AN ALIAS CANNOT BE FOUND
    ## ALIAS '@age' NO LONGER IN DOCUMENT, REQUERYING, REPLAYING COMMANDS
    ## GET 'form'
    ##   FIND 'input[name='age']'
    ##     TYPE '28'
