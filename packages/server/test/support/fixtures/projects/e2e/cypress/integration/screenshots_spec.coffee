describe "taking screenshots", ->
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
        ## failure 1
        throw new Error("fail whale")

  it "crops app captures to just app size", ->
    cy
      .viewport(600, 400)
      .visit('http://localhost:3322/color/yellow')
      .screenshot("crop-check")
      .task("check:screenshot:crop", { name: 'crop-check.png', width: 600, height: 400 })

  it "accepts screenshot after 10 tries if somehow app has pixels that match helper pixels", ->
    cy
      .viewport(1280, 720)
      .visit('http://localhost:3322/pathological')
      .screenshot("pathological")

  context "before hooks", ->
    before ->
      ## failure 2
      throw new Error("before hook failing")

    it "empty test 1", ->

  context "each hooks", ->
    beforeEach ->
      ## failure 3
      throw new Error("before each hook failed")

    afterEach ->
      ## failure 3 still (since associated only to a single test)
      throw new Error("after each hook failed")

    it "empty test 2", ->
