require("../spec_helper")

path         = require("path")
config       = require("#{root}lib/config")
cache        = require("#{root}lib/cache")
Project      = require("#{root}lib/project")
Settings     = require("#{root}lib/util/settings")
Keys         = require("#{root}lib/keys")

describe "Keys", ->
  beforeEach ->
    @sandbox.stub(Settings, "read").resolves({projectId: "abc-123-foo-bar"})

  it "returns a keys instance", ->
    keys = Keys("/Users/brian/app")
    expect(keys).to.be.instanceof Keys

  it "throws without a projectRoot", ->
    fn = -> Keys()
    expect(fn).to.throw "Instantiating lib/keys requires a projectRoot!"

  it "stores project", ->
    keys = Keys("/Users/brian/app")
    expect(keys.project).to.be.defined

  context "#nextKey", ->
    beforeEach ->
      @keys = Keys("/Users/brian/app")

      ## we need to force the range to resolve with a start and end
      ## else it would POST out to receive a project keys range
      @sandbox.stub(cache, "getProject").resolves({RANGE: {start: 0, end: 100}})

    afterEach ->
      cache.remove()

    it "ensures project id exists", ->
      ensureProjectId = @sandbox.spy @keys.project, "ensureProjectId"

      @keys.nextKey().then ->
        expect(ensureProjectId).to.be.calledOnce

    it "ensures cache exists", ->
      ensureExists = @sandbox.spy cache, "ensureExists"

      @keys.nextKey().then ->
        expect(ensureExists).to.be.called

    it "ensures cache has project", ->
      ensureProject = @sandbox.spy cache, "ensureProject"

      @keys.nextKey().then =>
        expect(ensureProject).to.be.calledOnce

    it "gets next test number", ->
      cache.getProject.resolves {RANGE: {start: 9, end: 100}}

      @keys.nextKey().then (id) ->
        expect(id).to.eq "00a"

  context "#_convertToId", ->
    beforeEach ->
      @keys = Keys("/Users/brian/app")

    it "zero pads up to 3 digits", ->
      num = (10).toString(36)
      expect(@keys._convertToId(10)).to.eq "00a"

  context "#getNextTestNumber", ->
    beforeEach ->
      @rangeRequest = nock(config.app.api_url)
      .matchHeader("X-Session", "123-456-789")
      .post("/projects/abc-123-foo-bar/keys")
      .reply(200, {
        start: 0,
        end: 10
      })

      @sandbox.stub(cache, "getUser").resolves({session_token: "123-456-789"})

      @keys = Keys("/Users/brian/app")

      @existingRangeIs = (obj = {}) =>
        @sandbox.stub(cache, "getProject").resolves({RANGE: obj})
        @sandbox.stub(cache, "updateRange").resolves({})

    afterEach ->
      nock.cleanAll()

      cache.remove()

    it "requests a new range when missing 'start' and 'end'", ->
      @existingRangeIs()

      @keys.getNextTestNumber("abc-123-foo-bar").then =>
        @rangeRequest.done()

    it "requests a new range when 'start' matches 'end'", ->
      @existingRangeIs({start: 10, end: 10})

      @keys.getNextTestNumber("abc-123-foo-bar").then =>
        @rangeRequest.done()

    it "returns the next test number which matches start: 0", ->
      @existingRangeIs()

      @keys.getNextTestNumber("abc-123-foo-bar").then (num) ->
        expect(num).to.eq 0

    it "increments the next test number when existing range", ->
      @existingRangeIs({start: 100, end: 200})

      @keys.getNextTestNumber("abc-123-foo-bar").then (num) =>
        expect(num).to.eq 101
        expect(@rangeRequest.isDone()).to.be.false

    it "can increment multiple test numbers when existing range", ->
      @existingRangeIs({start: 50, end: 100})

      @keys.getNextTestNumber().then (num) =>
        expect(num).to.eq 51
        @keys.getNextTestNumber().then (num) =>
          expect(num).to.eq 52
          @keys.getNextTestNumber().then (num) =>
            expect(num).to.eq 53
            @keys.getNextTestNumber().then (num) =>
              expect(num).to.eq 54
              expect(@rangeRequest.isDone()).to.be.false

    it "updates the cache range", ->
      @existingRangeIs({start: 5, end: 10})

      updateRange = cache.updateRange

      @keys.getNextTestNumber("abc-123-foo-bar").then (num) ->
        expect(num).to.eq 6
        expect(updateRange).to.be.calledWith "abc-123-foo-bar", {start: 6, end: 10}

    ## I removed the implementation for this test because it needs to be
    ## refactored anyway. the logic was incorrect about returning the correct
    ## starting range

    # it.only "requests a new range if after incrementing start matches end", ->
    #   @existingRangeIs({start: 999, end: 1000})

    #   @keys.getNextTestNumber("abc-123-foo-bar").then (num) =>
    #     expect(num).to.eq 1000
    #     @rangeRequest.done()
