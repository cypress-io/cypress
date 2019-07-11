describe "record fails", ->
  beforeEach ->
    throw new Error("foo")

  it "fails 1", ->

  it "is skipped", ->
