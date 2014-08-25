window.expect = chai.expect

before ->
  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()
