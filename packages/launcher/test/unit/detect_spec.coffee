require("../spec_helper")
detect = require('../../lib/detect')

describe "browser detection", ->
  it 'detects available browsers', ->
    detect().then (browsers) ->
      expect(browsers).to.be.an.array
