require("../spec_helper")
api = require('../..')

describe "launcher", ->
  it 'has all needed methods', ->
    expect(api.launch).to.be.a.function
    expect(api.detect).to.be.a.function
    expect(api.detectByPath).to.be.a.function
