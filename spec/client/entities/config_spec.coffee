describe "Config Entity", ->
  beforeEach ->
    @config = App.request("new:config:entity")

  context "#getCypressConfig", ->
    beforeEach ->
      @config.set
        foo: "bar"
        baz: "quux"
        commandTimeout: 4000
        visitTimeout: 30000
        requestTimeout: 5000
        responseTimeout: 20000
        baseUrl: "http://localhost:9000/app"
        viewportWidth: 800
        viewportHeight: 600

    it "picks commandTimeout, baseUrl, viewportWidth, viewportHeight", ->
      expect(@config.getCypressConfig()).to.deep.eq {
        commandTimeout: 4000
        visitTimeout: 30000
        requestTimeout: 5000
        responseTimeout: 20000
        baseUrl: "http://localhost:9000/app"
        viewportWidth: 800
        viewportHeight: 600
      }