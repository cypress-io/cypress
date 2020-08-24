require('../spec_helper')

const coerce = require(`${root}lib/util/coerce`)
const getProcessEnvVars = require(`${root}lib/config`).getProcessEnvVars

describe('lib/util/coerce', () => {
  beforeEach(function () {
    this.env = process.env
  })

  afterEach(function () {
    process.env = this.env
  })

  context('coerce', () => {
    it('coerces string', () => {
      expect(coerce('foo')).to.eq('foo')
    })

    it('coerces string from process.env', () => {
      process.env['CYPRESS_STRING'] = 'bar'
      const cypressEnvVar = getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).to.deep.include({ STRING: 'bar' })
    })

    it('coerces number', () => {
      expect(coerce('123')).to.eq(123)
    })

    // NOTE: When exporting shell variables, they are saved in `process.env` as strings, hence why
    // all `process.env` variables are assigned as strings in these unit tests
    it('coerces number from process.env', () => {
      process.env['CYPRESS_NUMBER'] = '8000'
      const cypressEnvVar = getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).to.deep.include({ NUMBER: 8000 })
    })

    it('coerces boolean', () => {
      expect(coerce('true')).to.be.true
    })

    it('coerces boolean from process.env', () => {
      process.env['CYPRESS_BOOLEAN'] = 'false'
      const cypressEnvVar = getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).to.deep.include({ BOOLEAN: false })
    })

    it('coerces array', () => {
      expect(coerce('[foo,bar]')).to.have.members(['foo', 'bar'])
    })

    it('coerces array from process.env', () => {
      process.env['CYPRESS_ARRAY'] = '[google.com,yahoo.com]'
      const cypressEnvVar = getProcessEnvVars(process.env)

      const coercedCypressEnvVar = coerce(cypressEnvVar)

      expect(coercedCypressEnvVar).to.have.keys('ARRAY')
      expect(coercedCypressEnvVar['ARRAY']).to.have.members(['google.com', 'yahoo.com'])
    })

    it('defaults value with multiple types to string', () => {
      expect(coerce('123foo456')).to.eq('123foo456')
    })
  })
})
