describe "record fails", ->
  it "fails 1", ->
    throw new Error("foo")

  it "fails 2", ->
    throw new Error("bar")
