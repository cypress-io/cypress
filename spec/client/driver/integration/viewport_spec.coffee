describe "Viewport", ->
  enterIntegrationTestingMode("html/viewport")

  context "viewport", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restoreAsserts()

      @Cypress.config({viewportWidth: 800, viewportHeight: 600})

    it "handles setting and reverting viewport", (done) ->
      logs = []

      @Cypress.on "log", (log) ->
        logs.push(log)

      @Cypress.run (failures) ->
        expect(failures).to.eq(0)

        ## first test visit
        visit1 = logs[0]
        expect(visit1.get("name")).to.eq("visit")
        expect(visit1.get("viewportWidth")).to.eq(800)
        expect(visit1.get("viewportHeight")).to.eq(600)

        ## first test viewport
        viewport1 = logs[1]
        expect(viewport1.get("name")).to.eq("viewport")
        expect(viewport1.get("viewportWidth")).to.eq(400)
        expect(viewport1.get("viewportHeight")).to.eq(300)

        ## first test get
        get1 = logs[2]
        expect(get1.get("name")).to.eq("get")
        expect(get1.get("viewportWidth")).to.eq(400)
        expect(get1.get("viewportHeight")).to.eq(300)

        ## first test viewport 2
        viewport2 = logs[3]
        expect(viewport2.get("name")).to.eq("viewport")
        expect(viewport2.get("viewportWidth")).to.eq(240)
        expect(viewport2.get("viewportHeight")).to.eq(250)

        ## second test visit
        ## which should have reverted back to original
        ## viewport settings
        visit2 = logs[4]
        expect(visit2.get("name")).to.eq("visit")
        expect(visit2.get("viewportWidth")).to.eq(800)
        expect(visit2.get("viewportHeight")).to.eq(600)

        ## second test get
        get2 = logs[5]
        expect(get2.get("name")).to.eq("get")
        expect(get2.get("viewportWidth")).to.eq(800)
        expect(get2.get("viewportHeight")).to.eq(600)

        done()
