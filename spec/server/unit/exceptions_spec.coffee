root      = "../../../"
expect    = require("chai").expect
Exception = require("#{root}lib/exception")
Routes    = require("#{root}lib/util/routes")

describe "Exceptions", ->
  context "#getUrl", ->
    it "returns Routes.exceptions_path()", ->
      expect(Exception.getUrl()).to.eq Routes.exceptions()