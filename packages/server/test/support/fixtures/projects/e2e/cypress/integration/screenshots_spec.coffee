describe "taking screenshots", ->
  it "manually generates pngs", ->
    cy
      .visit('http://localhost:3322/color/black')
      .screenshot("black", { capture: "runner" })
      .wait(1500)
      .visit('http://localhost:3322/color/red')
      .screenshot("red", { capture: "runner" })

  it "can nest screenshots in folders", ->
    cy
      .visit('http://localhost:3322/color/white')
      .screenshot("foo/bar/baz", { capture: "runner" })

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
      .screenshot("crop-check", { capture: "viewport" })
      .task("check:screenshot:size", { name: 'crop-check.png', width: 600, height: 400 })

  it "can capture fullPage screenshots", ->
    cy
      .viewport(600, 200)
      .visit('http://localhost:3322/fullPage')
      .screenshot("fullPage", { capture: "fullPage" })
      .task("check:screenshot:size", { name: 'fullPage.png', width: 600, height: 500 })

  it "accepts subsequent same captures after multiple tries", ->
    cy
      .viewport(600, 200)
      .visit('http://localhost:3322/fullPage-same')
      .screenshot("fullPage-same", { capture: "fullPage" })
      .task("check:screenshot:size", { name: 'fullPage-same.png', width: 600, height: 500 })

  it "accepts screenshot after multiple tries if somehow app has pixels that match helper pixels", ->
    cy
      .viewport(1280, 720)
      .visit('http://localhost:3322/pathological')
      .screenshot("pathological", { capture: "viewport" })

  it "can capture element screenshots", ->
    cy
      .viewport(600, 200)
      .visit('http://localhost:3322/element')
      .get(".element")
      .screenshot("element")
      .task("check:screenshot:size", { name: 'element.png', width: 400, height: 300 })

  it "retries each screenshot for up to 1500ms", ->
    cy
      .viewport(400, 400)
      .visit('http://localhost:3322/identical')
      .screenshot()
      .then (results) ->
        { duration } = results

        ## there should be 4 screenshots taken
        ## because the height is 1300px.
        ## the first will resolve super fast
        ## but the other 3 will take at least 1500ms
        ## but not much more!
        first = 500
        total = first + (1500 * 3)
        padding = 1000 * 3 ## account for exceeding 1500

        expect(duration).to.be.within(total, total + padding)

  describe "clipping", ->
    it "can clip app screenshots", ->
      cy
        .viewport(600, 200)
        .visit('http://localhost:3322/color/yellow')
        .screenshot("app-clip", { capture: "viewport", clip: { x: 10, y: 10, width: 100, height: 50 }})
        .task("check:screenshot:size", { name: 'app-clip.png', width: 100, height: 50 })

    it "can clip runner screenshots", ->
      cy
        .viewport(600, 200)
        .visit('http://localhost:3322/color/yellow')
        .screenshot("runner-clip", { capture: "runner", clip: { x: 15, y: 15, width: 120, height: 60 }})
        .task("check:screenshot:size", { name: 'runner-clip.png', width: 120, height: 60 })

    it "can clip fullPage screenshots", ->
      cy
        .viewport(600, 200)
        .visit('http://localhost:3322/fullPage')
        .screenshot("fullPage-clip", { capture: "fullPage", clip: { x: 20, y: 20, width: 140, height: 70 }})
        .task("check:screenshot:size", { name: 'fullPage-clip.png', width: 140, height: 70 })

    it "can clip element screenshots", ->
      cy
        .viewport(600, 200)
        .visit('http://localhost:3322/element')
        .get(".element")
        .screenshot("element-clip", { clip: { x: 25, y: 25, width: 160, height: 80 }})
        .task("check:screenshot:size", { name: 'element-clip.png', width: 160, height: 80 })

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
