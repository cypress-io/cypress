require("../spec_helper")
launcher = require('../..')

describe "launcher", ->
  it 'returns a function', ->
    expect(launcher).to.be.a.function

  it 'has update method', ->
    expect(launcher.update).to.be.a.function

  it 'returns api with launch method', ->
    launcher().then (api) ->
      expect(api.launch).to.be.a.function
