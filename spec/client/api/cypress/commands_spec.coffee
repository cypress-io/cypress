describe "$Cypress.Commands API", ->
  beforeEach ->
    @commands = $Cypress.Commands.create()

  context "#reset", ->
    it "resets to zero commands", ->
      @commands.splice(0, 1, {})
      @commands.splice(1, 2, {})
      expect(@commands.length).to.eq(2)
      @commands.reset()
      expect(@commands.length).to.eq(0)