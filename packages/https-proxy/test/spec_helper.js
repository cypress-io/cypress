const chai = require('chai')
const sinon = require('sinon')
const Promise = require('bluebird')
const sinonChai = require('sinon-chai')
const request = require('@cypress/request-promise')
const supertest = require('supertest')

require('sinon-as-promised')(Promise)

chai.use(sinonChai)

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  return this.sandbox.restore()
})

module.exports = { request, sinon, supertest, expect: chai.expect }
