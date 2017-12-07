require("../spec_helper")
launcher = require('../..')
{ stubSpawnOnce, stubSpawnShellOnce } = require('stub-spawn-once')

describe "launcher", ->
  it 'returns a function', ->
    expect(launcher).to.be.a.function

  it 'has update method', ->
    expect(launcher.update).to.be.a.function

  it 'returns api with launch method', ->
    launcher().then (api) ->
      expect(api.launch).to.be.a.function

  it "finds a browser given a path", ->
    myBrowser = '/path/to/my/chrome'
    # when launcher tries to confirm the browser exists
    stubSpawnShellOnce('/path/to/my/chrome --version', 0, 'Google Chrome 999', '')
    # when launcher actually tries to launch the browser
    spawn = @sandbox.stub().withArgs(myBrowser, [], {stdio: 'ignore'})
      .returns('cp')

    launcher(myBrowser).then (api) ->
      expect(api.launch).to.be.a.function
      cp = api.launch(myBrowser, undefined, [], spawn)
      expect(spawn).to.have.been.calledOnce
      expect(cp).to.equal(cp)
