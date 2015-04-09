describe "$Cypress Events Extension", ->
  beforeEach ->
    @Cypress = $Cypress.create()

  context ".off", ->
    it "can remove event by name", ->
      @Cypress.on "foo", ->

      expect(@Cypress.event("foo")).to.have.length(1)

      @Cypress.off "foo"

      expect(@Cypress.event("foo")).to.have.length(0)

    it "can remove event by name + callback fn", ->
      fn = ->

      @Cypress.on "foo", -> "foo"
      @Cypress.on "foo", fn

      expect(@Cypress.event("foo")).to.have.length(2)

      @Cypress.off "foo", fn

      expect(@Cypress.event("foo")).to.have.length(1)

      @Cypress.off "foo"

  context ".on", ->
    it "replaces existing events if function matches", ->
      fn = ->

      @Cypress.on "foo", fn
      @Cypress.on "foo", fn

      expect(@Cypress.event("foo")).to.have.length(1)

      @Cypress.off "foo", fn

  context ".event", ->
    it "gets all callsbacks by name", ->
      @Cypress.on "foo", fn1 = ->
      @Cypress.on "foo", fn2 = ->

      events = @Cypress.event("foo")
      expect(events).to.deep.eq [fn1, fn2]

  context ".invoke", ->
    it "invokes events by name with arguments", ->
      args = []
      ctxs = []

      @Cypress.cy = {}

      @Cypress.on "foo", (arg) ->
        ctxs.push @
        args.push arg

      @Cypress.on "foo", (arg) ->
        ctxs.push @
        args.push arg

      @Cypress.invoke "foo", "arg1"

      expect(args).to.deep.eq ["arg1", "arg1"]
      expect(ctxs).to.deep.eq [@Cypress.cy, @Cypress.cy]
