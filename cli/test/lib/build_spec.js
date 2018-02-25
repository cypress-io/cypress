require('../spec_helper')

const fs = require(`${lib}/fs`)
const makeUserPackageFile = require('../../scripts/build')
const snapshot = require('snap-shot-it')

describe('package.json build', () => {
  beforeEach(function () {
    // stub package.json in CLI
    // with a few test props
    // the rest should come from root package.json file
    this.sandbox.stub(fs, 'readJsonAsync').resolves({
      name: 'test',
      engines: 'test engines',
    })
    this.sandbox.stub(fs, 'outputJsonAsync').resolves()
  })

  it('outputs expected engines property', () => {
    return makeUserPackageFile().then(snapshot)
  })
})
