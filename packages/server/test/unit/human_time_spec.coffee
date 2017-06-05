require("../spec_helper")

humanInterval = require("human-interval")
humanTime     = require("#{root}lib/util/human_time")

describe "lib/util/human_time", ->
  it "outputs minutes + seconds", ->
    expect(humanTime(humanInterval("2 minutes and 3 seconds"))).to.eq("2 minutes, 3 seconds")
    expect(humanTime(humanInterval("65 minutes"))).to.eq("65 minutes, 0 seconds")
    expect(humanTime(humanInterval("1 minute"))).to.eq("1 minute, 0 seconds")

  it "outputs seconds", ->
    expect(humanTime(humanInterval("59 seconds"))).to.eq("59 seconds")
    expect(humanTime(humanInterval("1 second"))).to.eq("1 second")
