const { expect } = require('chai')
const preprocessor = require('../../dist/index')

describe('typescript ./dist output', () => {
  it('builds dist correctly', () => {
    expect(preprocessor).to.be.a('function')
    expect(preprocessor).to.have.property('defaultOptions')
  })
})
