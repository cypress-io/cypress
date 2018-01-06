describe "simple failing hook spec", ->
  beforeEach ->
    throw new Error('fail')

  it "never gets here", ->
