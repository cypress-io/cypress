/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const randomstring = require("randomstring");
const random = require(`${root}lib/util/random`);

context(".id", function() {
  it("returns random.generate string with length 5 by default", function() {
    sinon.spy(randomstring, "generate");

    const id = random.id();
    expect(id.length).to.eq(5);

    return expect(randomstring.generate).to.be.calledWith({
      length: 5,
      capitalization: "lowercase"
    });
  });

  return it("passes the length parameter if supplied", function() {
    sinon.spy(randomstring, "generate");

    const id = random.id(32);
    expect(id.length).to.eq(32);

    return expect(randomstring.generate).to.be.calledWith({
      length: 32,
      capitalization: "lowercase"
    });
  });
});
