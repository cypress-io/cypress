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
      @cmd = @commands.splice(0, 1, {
        args: ["foo", "bar", {
          log: false
          assertions: [1,2,3]
          timeout: 2000
          _log: {foo: "bar"}
          verify: null
        }]
      })

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
      cmd = @commands.splice(0, 1, {args: ["foo"]})
      c2 = cmd.clone()
      expect(c2.get("args")).to.deep.eq ["foo"]

  context "#slice", ->
    beforeEach ->
      @commands.splice(0, 1, {})
      @commands.splice(1, 2, {})
      @commands.splice(2, 3, {})
      @commands.splice(3, 4, {})

    it "returns a new instance", ->
      expect(@commands.length).to.eq(4)
      commands2 = @commands.slice(0, 2)
      expect(commands2.length).to.eq(2)
      expect(@commands.length).to.eq(4)

  context "#get", ->
    beforeEach ->
      @commands.splice(0, 1, {})
      @commands.splice(1, 2, {})

    it "returns the commands array", ->
      arr = @commands.get()
      expect(arr.length).to.eq(2)
      expect(arr).to.be.instanceof(Array)

  context "#where", ->
    beforeEach ->
      @commands.splice(0, 1, {name: "foo"})
      @commands.splice(1, 2, {name: "bar"})
      @commands.splice(2, 3, {name: "foo"})

    it "returns array of commands by name", ->
      cmds = @commands.where({name: "foo"})
      names = _(cmds).invoke("get", "name")
      expect(cmds.length).to.eq(2)
      expect(names).to.deep.eq ["foo", "foo"]

  context "#findWhere", ->
    beforeEach ->
      @commands.splice(0, 1, {id: 1, name: "foo"})
      @commands.splice(1, 2, {id: 2, name: "bar"})
      @commands.splice(2, 3, {id: 3, name: "foo"})

    it "returns first command by name", ->
      cmd = @commands.findWhere({name: "foo"})
      expect(cmd.get("name")).to.eq("foo")
      expect(cmd.get("id")).to.eq(1)
