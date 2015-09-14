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

  context "#clone", ->
    beforeEach ->
      @commands.splice(0, 1, {
        args: ["foo", "bar", {
          log: false
          assertions: [1,2,3]
          timeout: 2000
          _log: {foo: "bar"}
          verify: null
        }]
      })

      @cmd = @commands.at(0)

    it "strips out non-primitives from args and sets {log: true}", ->
      c2 = @cmd.clone()
      expect(c2.get("args")).to.deep.eq([
        "foo", "bar", {
          log: true
          timeout: 2000
          verify: null
        }
      ])

    it "does not remove arguments when nothing is an object", ->
      @commands.splice(0, 1, {args: ["foo"]})
      c2 = @commands.at(0).clone()
      expect(c2.get("args")).to.deep.eq ["foo"]