/**
 * as of Webpack 5, dependencies that are polyfilled through the Provide plugin must be defined inside the CLI
 * in order to guarantee there is a version of the dependency accessible by the cypress CLI, either in the cypress directory
 * or the root of their project. Currently, these two dependencies are 'buffer' and 'process'
 */
describe('dependencies', () => {
  it('process dependency exists in package.json and is available', () => {
    const { dependencies } = require('../../../package.json')

    expect(dependencies.process).to.be.ok

    const process = require('process')

    expect(typeof process).to.equal('object')
  })

  it('buffer dependency exists in package.json and is available', () => {
    const { dependencies } = require('../../../package.json')

    expect(dependencies.buffer).to.be.ok

    const buffer = require('buffer')

    expect(typeof buffer).to.equal('object')
  })
})
