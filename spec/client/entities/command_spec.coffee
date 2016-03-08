describe "Command Entities", ->
  beforeEach ->
    @commands = App.request "command:entities"

  context "#createCommand", ->
    beforeEach ->
      @Cypress = $Cypress.create()

    it "instantiates command with white listed attributes from the log", ->
      attrs = {
        event: "Command"
        error: null
        state: "passed"
        testId: 123
        hookName: "test"
        type: "parent"
        highlightAttr: "attr"
        name: "visit"
        alias: null
        aliasType: null
        referencesAlias: null
        message: "http://localhost:8000"
        numElements: 1
        numRetries: 1
        visible: true
        coords: {x: 1, y: 2}
        scrollBy: 10
        viewportWidth: 1000
        viewportHeight: 660
        url: "http://localhost:8001"
      }

      @log     = new $Cypress.Log @Cypress
      @log.set attrs

      @command = @commands.createCommand @log
      _.each attrs, (value, key) =>
        expect(@command.get(key)).to.eq value


    it "listens to attrs:changed and sets whitelisted changed attributes", ->
      @log     = new $Cypress.Log @Cypress
      @log.set {
        state: "pending"
        type: "parent"
      }

      @command = @commands.createCommand @log
      expect(@command.get("state")).to.eq "pending"

      @log.set({
        state: "passed"
        url: "http://localhost:8001"
      })

      expect(@command.get("state")).to.eq "passed"
      expect(@command.get("url")).to.eq "http://localhost:8001"
