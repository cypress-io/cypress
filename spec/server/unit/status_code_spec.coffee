require("../spec_helper")

statusCode = require("#{root}lib/util/status_code")

describe "lib/util/status_code", ->
  context ".isOk", ->
    it "numbers starting with 2xx and 3xx returns true", ->
      [200, 300, 301, 299, 302, 201, "200", "300"].forEach (code) ->
        expect(statusCode.isOk(code), "expected status code: #{code} to be true").to.be.true

    it "numbers not starting with 2xx or 3xx returns false", ->
      [100, 400, 401, 500, 404, 503, "200a", "300b"].forEach (code) ->
        expect(statusCode.isOk(code), "expected status code: #{code} to be false").to.be.false

