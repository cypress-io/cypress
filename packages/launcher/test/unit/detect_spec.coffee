require("../spec_helper")
detect = require('../../lib/detect').default

describe "browser detection", ->
  it 'detects available browsers', ->
    detect().then (browsers) ->
      expect(browsers).to.be.an.array
