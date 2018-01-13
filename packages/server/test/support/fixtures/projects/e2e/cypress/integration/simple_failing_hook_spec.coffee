describe "simple failing hook spec", ->
  context "beforeEach hooks", ->
    beforeEach ->
      throw new Error('fail')

    it "never gets here", ->

  context "pending", ->
    it "is pending"

  context "afterEach hooks", ->
    afterEach ->
      throw new Error('fail')

    it "runs this", ->

    it "does not run this", ->
