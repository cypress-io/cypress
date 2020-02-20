/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai          = require("chai");
const sinon         = require("sinon");
const Promise       = require("bluebird");
const sinonChai     = require("sinon-chai");
const sinonPromise  = require("sinon-as-promised")(Promise);

global.request   = require("request-promise");
global.sinon     = sinon;
global.supertest = require("supertest");

chai.use(sinonChai);

global.expect = chai.expect;

beforeEach(function() {
  return this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  return this.sandbox.restore();
});
