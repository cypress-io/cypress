root         = '../../../'
path         = require 'path'
fs           = require 'fs'
chai         = require 'chai'
sinon        = require "sinon"
sinonPromise = require 'sinon-as-promised'
sinonChai    = require 'sinon-chai'
Server       = require "#{root}lib/server"
Keys         = require "#{root}lib/keys"
Settings     = require "#{root}lib/util/settings"
IdGenerator  = require "#{root}lib/id_generator"
Fixtures     = require "#{root}/spec/server/helpers/fixtures"

expect       = chai.expect
chai.use(sinonChai)

describe "IdGenerator", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Settings, "read").resolves({projectId: "abc-123-foo-bar"})
    @sandbox.stub(Settings, "readSync").returns({})

    @server      = Server(process.cwd())
    @idGenerator = IdGenerator(@server.app)

  afterEach ->
    @sandbox.restore()

  it "stores app", ->
    expect(@idGenerator.app).to.eq @server.app

  it "stores projectRoot", ->
    expect(@idGenerator.projectRoot).to.eq process.cwd()

  it "stores keys", ->
    expect(@idGenerator.keys).to.be.instanceof Keys

  context "#nextId", ->
    beforeEach ->
      @sandbox.stub(@idGenerator, "appendTestId").resolves({})
      @sandbox.stub(@idGenerator.keys, "nextKey").resolves("00a")

    it "does not catch any errors", (done) ->
      @idGenerator.nextId({}).then ->
        done()
      .catch (err) ->
        done(err)

    it "returns the generated id", ->
      @idGenerator.nextId({}).then (id) ->
        expect(id).to.eq "00a"

  context "#getId", ->
    beforeEach ->
      @sandbox.stub(@idGenerator, "appendTestId").resolves({})
      @sandbox.stub(@idGenerator.keys.cache, "getProject").resolves({RANGE: {start: 0, end: 100}})

    afterEach ->
      @idGenerator.keys.cache.remove()

    it "queues multiple ids through promise semaphore", ->
      @idGenerator.getId({})
      @idGenerator.getId({})
      @idGenerator.getId({})
      @idGenerator.getId({})
      @idGenerator.getId({})
      @idGenerator.getId({})
      @idGenerator.getId({})
      @idGenerator.getId({}).then (num) ->
        expect(num).to.eql("008")

  context "#appendTestId", ->
    describe "unit", ->
      beforeEach ->
        @clock    = @sandbox.useFakeTimers()
        @contents = Fixtures.get("ids/app.coffee")
        @read     = @sandbox.stub(@idGenerator, "read").resolves(@contents)
        @write    = @sandbox.stub(@idGenerator, "write").resolves()
        @insertId = @sandbox.spy(@idGenerator, "insertId")
        @idGenerator.appendTestId "tests/app/foo.js", "starts up", "w0w"

      it "calls #read with normalizedPath", ->
        expect(@read).to.be.calledWith process.cwd() + "/tests/app/foo.js"

      it "passes #read contents, title, and id to insertId", ->
        expect(@insertId).to.be.calledWith @contents, "starts up", "w0w"

      it "enables editFileMode", ->
        expect(@server.app.get("editFileMode")).to.be.true

      it "calls #write with normalizedPath and new content", ->
        newContents = @idGenerator.insertId @contents, "starts up", "w0w"
        expect(@write).to.be.calledWith process.cwd() + "/tests/app/foo.js", newContents

      it "disables editFileMode after 1 second", ->
        expect(@server.app.get("editFileMode")).to.be.true
        @clock.tick(1000)
        expect(@server.app.get("editFileMode")).to.be.false

      it "#write is never called when hasExistingId", ->
        contents = Fixtures.get("ids/existing.coffee")
        @read.resolves(contents)
        @write.reset()

        @idGenerator.appendTestId("", "foobars", "abc").then ->
          expect(@write).not.to.be.called

    describe "integration", ->
      beforeEach ->
        Fixtures.scaffold("todos")
        @projectRoot = @idGenerator.projectRoot = Fixtures.project("todos")

      afterEach ->
        Fixtures.remove()

      it "inserts id into test", ->
        @idGenerator.appendTestId("tests/test1.js", "is truthy", "123").then ->
          contents = fs.readFileSync path.join(@projectRoot, "tests", "test1.js"), "utf8"
          expect(contents).to.eq Fixtures.get("ids/todos_test1_expected.js")

  context "#insertId", ->
    it "inserts id into the string content", ->
      contents = Fixtures.get("ids/simple.coffee")
      newContent = @idGenerator.insertId contents, "foos", "0ab"
      expect(newContent).to.eq 'it "foos [0ab]", ->'

    it "throws special idFound error when id exists", ->
      contents = Fixtures.get("ids/existing.coffee")
      fn = => @idGenerator.insertId contents, "foobars", "abc"
      expect(fn).to.throw(Error)

    describe "abnormal characters", ->
      ["|", "^", "&", "@", "*", ">", "<", ":", "!", "#", "$", "%", "(", ")", ",", ".", "]", "[", "}", "{"].forEach (char) ->
        it "escapes char: #{char}", ->
          contents = "it 'char #{char} here', ->"
          newContent = @idGenerator.insertId contents, "char #{char} here", "123"
          expect(newContent).to.eq "it 'char #{char} here [123]', ->"