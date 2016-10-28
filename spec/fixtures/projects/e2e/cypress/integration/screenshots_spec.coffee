describe "screenshots", ->
  it "manually generates pngs", ->
    cy
      .visit('http://localhost:3322/color/black')
      .screenshot("black")
      .wait(1500)
      .visit('http://localhost:3322/color/red')
      .screenshot("red")

  it "can nest screenshots in folders", ->
    cy
      .visit('http://localhost:3322/color/white')
      .screenshot("foo/bar/baz")

  it "generates pngs on failure", ->
    cy
      .visit('http://localhost:3322/color/yellow')
      .wait(1500)
      .then ->
        throw new Error("fail whale")