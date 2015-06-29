describe "Config Entity", ->
  beforeEach ->
    @config = App.request("new:config:entity")

  context "#revertDom", ->
    beforeEach ->
      @trigger = @sandbox.spy @config, "trigger"

    it "triggers 'cannot:revert:dom' if isRunning", ->
      @config.run()
      @config.revertDom()
      expect(@trigger).to.be.calledWith "cannot:revert:dom", true

    it "triggers 'cannot:rever:dom' false", ->
      @config.run()
      @config.revertDom({}, false)
      expect(@trigger).to.be.calledWith "cannot:revert:dom", false

  context "#run", ->
    it "sets running to true", ->
      @config.run()
      expect(@config.isRunning()).to.be.true

    it "sets running to false", ->
      @config.run(false)
      expect(@config.isRunning()).to.be.false

  context "#getCypressConfig", ->
    beforeEach ->
      @config.set
        foo: "bar"
        baz: "quux"
        commandTimeout: 4000
        baseUrl: "http://localhost:9000/app"
        viewportWidth: 800
        viewportHeight: 600

    it "picks commandTimeout, baseUrl, viewportWidth, viewportHeight", ->
      expect(@config.getCypressConfig()).to.deep.eq {
        commandTimeout: 4000
        baseUrl: "http://localhost:9000/app"
        viewportWidth: 800
        viewportHeight: 600
      }