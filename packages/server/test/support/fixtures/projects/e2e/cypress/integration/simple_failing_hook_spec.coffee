describe "simple failing hook spec", ->
  context "beforeEach hooks", ->
    beforeEach ->
      throw new Error("fail1")

    it "never gets here", ->

  context "pending", ->
    it "is pending"

  context "afterEach hooks", ->
    afterEach ->
      throw new Error("fail2")

    it "runs this", ->

    it "does not run this", ->

  context "after hooks", ->
    after ->
      throw new Error("fail3")

    it "runs this", ->

    it "fails on this", ->
