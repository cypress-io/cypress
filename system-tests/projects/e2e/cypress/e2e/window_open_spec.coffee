describe "window.open", ->
  it "can access the child window", ->
    cy
      .visit("/index.html")
      .window().then (win) ->
        new Cypress.Promise (resolve, reject) ->
          win.foo = Cypress._.after(2, resolve)

          debugger

          child = win.open("/window_open.html", "foo", "width=371.58px,height=660px,left=1068.42px,menubar=no,scrollbars=no,status=no")

          bar = ->
            try
              if b = child.bar
                b()
              else
                check()
            catch err
              reject(err)

          check = do ->
            setTimeout(bar, 100)