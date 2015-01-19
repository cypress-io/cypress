root          = '../../../'
path          = require 'path'
info          = path.join(__dirname, root, '/.cy/', 'local.info')
Promise       = require 'bluebird'
expect        = require('chai').expect
Keys          = require "#{root}lib/keys"
AppInfo       = require "#{root}lib/app_info"
fs            = Promise.promisifyAll(require('fs'))
nock          = require 'nock'
rimraf        = require 'rimraf'
sinon         = require('sinon')

require('chai')
.use(require('sinon-chai'))
.use(require("chai-as-promised"))
.should()

describe "local cache", ->
  beforeEach ->
    nock.disableNetConnect()
    @appInfo = new AppInfo

  afterEach (done)->
    nock.cleanAll()
    nock.enableNetConnect()
    rimraf(path.dirname(info), (e) -> done(e))

  it "creates an offline cache if not present", (done) ->
    @appInfo.ensureExists()
    .then =>
      fs.statAsync(info)
    .then => done()
    .catch(done)

  it "returns true when already exists", (done) ->
    @appInfo.ensureExists()
    .then =>
      @appInfo.ensureExists()
      .should.eventually.eql(true)
      .then(=>done())
    .catch(done)

  context "validators", ->
    it "creates an empty PROJECTS key", (done) ->
      @appInfo.ensureExists()
      .then => @appInfo._read()
      .then (contents) ->
        contents.should.eql({PROJECTS: {}})
        done()
      .catch(done)

    it "creates an empty RANGE key for a Project", (done) ->
      @appInfo.ensureExists()
      .then => @appInfo.addProject("FOO")
      .then => @appInfo._read()
      .then (contents) =>
        contents.should.eql({
          PROJECTS: {FOO: {RANGE: {}}}
        })
        done()
      .catch(done)

  context "projects", ->
    beforeEach ->
      @appInfo.ensureExists()

    describe "#getProject", ->
      it "returns the project by id", (done) ->
        @appInfo.addProject("FOO").then (project) =>
          @appInfo.getProject("FOO").then (project) ->
            expect(project).to.deep.eq {RANGE: {}}
            done()
        .catch(done)

      it "throws an error when a project is not found", (done) ->
        @appInfo.getProject("FOO")
        .catch (err) ->
          err.message.should.eql("Project FOO not found")
          done()

    describe "#addProject", ->
      it "returns the project when exists", (done) ->
        @appInfo.addProject("FOO")
        .then =>
          @appInfo.getProject("FOO")
        .then (val) ->
          val.should.be.defined
          done()
        .catch(done)

      it "can add a single project", (done) ->
        @appInfo.addProject("FOO")
        .then => done()
        .catch(done)

      it "does not override existing properties", (done) ->
        @appInfo._set("qwerty", 1234).then (contents) =>
          @appInfo.addProject("DOES_NOT_EXIST")
        .then (contents) ->
          expect(contents).to.have.property("qwerty", 1234)
          expect(contents).to.have.property("PROJECTS")
          done()
        .catch(done)

    describe "#updateProject", ->
      beforeEach ->
        @appInfo.addProject("BAR")

      it "can update a single project", (done) ->
        @appInfo.updateProject("BAR", {wow: 1})
        .then (c) => c.should.eql({RANGE: {}, wow: 1}); done()
        .catch(done)

      it "can update a project range", (done) ->
        @appInfo.updateRange("BAR", {start: 1, end: 2})
        .then (p) =>
          p.should.eql({RANGE: {start:1,end:2}}); done()
        .catch(done)

      it "overrides only conflicting properties", (done) ->
        @appInfo.updateProject("BAR", {bar: "bar", foo: "foo"}).then =>
          @appInfo.updateProject("BAR", {bar: "baz"}).then (project) =>
            expect(project).to.have.property("foo", "foo")
            expect(project).to.have.property("bar", "baz")
            done()
        .catch(done)

  context "utilities", ->
    it "can remove a single project"

  context "#getSessionId", ->
    beforeEach ->
      @appInfo.ensureExists()

    it "returns session id", (done) ->
      @appInfo.setSessionId(1234).then =>
        @appInfo.getSessionId().then (id) ->
          expect(id).to.eq 1234
          done()
      .catch(done)

  context "#setSessionId", ->
    beforeEach ->
      @appInfo.ensureExists()

    it "sets SESSION_ID into .cy", (done) ->
      @appInfo.setSessionId(1234).then (contents) ->
        expect(contents.SESSION_ID).to.eq 1234
        done()
      .catch(done)

  context "#_set", ->
    beforeEach ->
      @appInfo.ensureExists()

    it "does not override existing properties", (done) ->
      @appInfo._write({foo: "foo"}).then (contents) =>
        @appInfo._set({bar: "bar"}).then (contents) ->
          expect(contents.foo).to.eq "foo"
          expect(contents.bar).to.eq "bar"
          done()
      .catch(done)
