{ durationFormatted, stripLeadingCyDirs } = require("../../src/lib/utils")

## TODO: remove these once we move durationFormatted
## to a shared @cypress module
describe "durationFormatted", ->
  it "formats ms", ->
    expect(durationFormatted(496)).to.eq('496ms')

  it "formats 1 digit secs", ->
    expect(durationFormatted(1000)).to.eq('00:01')

  it "formats 2 digit secs", ->
    expect(durationFormatted(21000)).to.eq('00:21')

  it "formats mins and secs", ->
    expect(durationFormatted(321000)).to.eq('05:21')

  it "formats 2 digit mins and secs", ->
    expect(durationFormatted(3330000)).to.eq('55:30')

  it "formats hours with mins", ->
    expect(durationFormatted(33300000)).to.eq('9:15:00')

describe "stripLeadingCyDirs", ->
  it "strips leading cypress directories from spec", ->
    expect(stripLeadingCyDirs('cypress/integration/login_spec.js')).to.eq('login_spec.js')
