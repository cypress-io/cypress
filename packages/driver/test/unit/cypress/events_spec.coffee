describe "$Cypress Events Extension", ->
  beforeEach ->
    @Cypress = $Cypress.create()

  context ".trigger", ->
    it "forces ctx to by @cy", (done) ->
      cy = @Cypress.cy = {}
      @Cypress.on "foo", ->
        expect(@).to.eq cy
        done()

      @Cypress.trigger "foo"

    it "still triggers twice", ->
      count = 0

      @Cypress.on "foo", ->
        count += 1

      @Cypress.on "foo", ->
        count += 1

      @Cypress.trigger("foo")
      expect(count).to.eq 2

    it "does not throw if there are no _events", ->
      @Cypress.trigger("foobar")

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
