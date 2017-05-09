require("../spec_helper")
launcher = require('../..')

describe "launcher", ->
  it 'returns a function', ->
    expect(launcher).to.be.a.function

  it 'has update method', ->
    expect(launcher.update).to.be.a.function

  it 'finds installed browsers', ->
    launcher().then(console.log)
