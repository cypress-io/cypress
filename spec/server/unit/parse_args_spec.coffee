require("../spec_helper")

parseArgs = require "#{root}lib/util/parse_args"

describe "parseArgs", ->
  context "--smoke-test", ->
    beforeEach ->
      @setup = (args...) ->
        @options = {}
        @options.argv = args
        parseArgs(@options)

    it "sets pong to ping", ->
      @setup("--smoke-test", "--ping=123")
      expect(@options.pong).to.eq 123