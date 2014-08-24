describe "Command Entities", ->
  beforeEach ->
    @commands = App.request "command:entities"

  context "#addDom", ->
    beforeEach ->
      attrs =
        parent: undefined
        id: "instance1"

      @parent = @commands.add attrs, "dom", {cid: 1}

    it "can add a dom command", ->
      expect(@commands.length).to.eq 1

    it "sets parent / child commands", ->
      attrs =
        parent: "instance1"
        id: "instance2"

      child = @commands.add attrs, "dom", {cid: 2}
      expect(child.parent).to.eq @parent

    it "sets the parent isParent to true", ->
      attrs =
        parent: "instance1"
        id: "instance2"

      child = @commands.add attrs, "dom", {cid: 2}
      expect(child.parent.isParent()).to.be.true