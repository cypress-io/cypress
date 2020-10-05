const { expect } = require('chai')
const preprocessor = require('../../dist/index')

describe('tyepscript ./dist output', () => {
  it('builds dist correctly', () => {
    expect(preprocessor).to.be.a('function')
    expect(preprocessor).to.have.property('defaultOptions')
  })
})
