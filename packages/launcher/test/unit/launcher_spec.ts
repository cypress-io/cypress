require('../spec_helper')

const api = require('../..')

describe('launcher', function () {
  it('has all needed methods', function () {
    expect(api.launch).to.be.a('function')
    expect(api.detect).to.be.a('function')
    expect(api.detectByPath).to.be.a('function')
  })
})
