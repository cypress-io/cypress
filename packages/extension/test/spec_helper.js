/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai      = require("chai");
const sinon     = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);

global.sinon = sinon;
global.expect = chai.expect;

afterEach(() => sinon.restore());
