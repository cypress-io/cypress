require("../spec_helper")
api = require('../..')

describe "launcher", ->
  it 'has launch and detect methods', ->
    expect(api.launch).to.be.a.function
    expect(api.detect).to.be.a.function
