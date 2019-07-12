{ _ } = window.testUtils

## FIXME: Needs re-write to test new interface
describe.skip "$Cypress.Commands API", ->
  beforeEach ->
    @commands = $Cypress.Commands.create()

  context "#reset", ->
    it "resets to zero commands", ->
      @commands.splice(0, 1, {})
      @commands.splice(1, 2, {})
      expect(@queue.length).to.eq(2)
      @commands.reset()
      expect(@queue.length).to.eq(0)

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

  context "#stringify", ->
    beforeEach ->
      @commands.splice(0, 1, {name: "get", args: ["form:first"]})
      @commands.splice(1, 2, {name: "click", args: [{multiple: true}]})
      @commands.splice(2, 3, {name: "then", args: [->{}]})
      @commands.splice(3, 4, {name: "get", args: ["body", {timeout: 1000}]})
      @commands.splice(4, 5, {name: "should", args: ["have.prop", "class", "active"]})

    it "returns command name + args", ->
      expect(@commands.at(0).stringify()).to.eq("cy.get('form:first')")
      expect(@commands.at(1).stringify()).to.eq("cy.click('...')")
      expect(@commands.at(2).stringify()).to.eq("cy.then('...')")
      expect(@commands.at(3).stringify()).to.eq("cy.get('body, ...')")
      expect(@commands.at(4).stringify()).to.eq("cy.should('have.prop, class, active')")

  context "#reduce", ->
    beforeEach ->
      @commands.splice(0, 1, {name: "get", args: ["form:first"]})
      @commands.splice(1, 2, {name: "click", args: [{multiple: true}]})

    it "reduces commands into array", ->
      cmds = @commands.reduce (memo, cmd) ->
        memo.push cmd.get("name")
        memo
      , []

      expect(cmds).to.deep.eq(["get", "click"])

  context "#slice", ->
    beforeEach ->
      @commands.splice(0, 1, {})
      @commands.splice(1, 2, {})
      @commands.splice(2, 3, {})
      @commands.splice(3, 4, {})

    it "returns a new instance", ->
      expect(@queue.length).to.eq(4)
      commands2 = @commands.slice(0, 2)
      expect(commands2.length).to.eq(2)
      expect(@queue.length).to.eq(4)

  context "#get", ->
    beforeEach ->
      @commands.splice(0, 1, {})
      @commands.splice(1, 2, {})

    it "returns the commands array", ->
      arr = @commands.get()
      expect(arr.length).to.eq(2)
      expect(arr).to.be.instanceof(Array)

  context "#filter", ->
    beforeEach ->
      @commands.splice(0, 1, {name: "foo"})
      @commands.splice(1, 2, {name: "bar"})
      @commands.splice(2, 3, {name: "foo"})

    it "returns array of commands by name", ->
      cmds = @commands.filter({name: "foo"})
      names = _.invokeMap(cmds, "get", "name")
      expect(cmds.length).to.eq(2)
      expect(names).to.deep.eq ["foo", "foo"]

  context "#find", ->
    beforeEach ->
      @commands.splice(0, 1, {id: 1, name: "foo"})
      @commands.splice(1, 2, {id: 2, name: "bar"})
      @commands.splice(2, 3, {id: 3, name: "foo"})

    it "returns first command by name", ->
      cmd = @commands.find({name: "foo"})
      expect(cmd.get("name")).to.eq("foo")
      expect(cmd.get("id")).to.eq(1)

  context "#hasPreviouslyLinkedCommand", ->
    it "is true when prev + matching chainerIds", ->
      c1 = @commands.splice(0, 1, {chainerId: 123})
      c2 = @commands.splice(1, 2, {chainerId: 123, prev: c1})
      expect(c2.hasPreviouslyLinkedCommand()).to.be.true

    it "is false when prev + not matching chainerIds", ->
      c1 = @commands.splice(0, 1, {chainerId: 123})
      c2 = @commands.splice(1, 2, {chainerId: 124, prev: c1})
      expect(c2.hasPreviouslyLinkedCommand()).to.be.false

    it "is false when no prev", ->
      c1 = @commands.splice(0, 1, {chainerId: 123})
      expect(c1.hasPreviouslyLinkedCommand()).to.be.false
