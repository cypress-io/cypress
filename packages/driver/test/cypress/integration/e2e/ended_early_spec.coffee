describe "ended early", ->
  it "can end early without problems", (done) ->
    cy
      .wrap(null)
      .then ->
        done()
      .then ->
        throw new Error("foo")
