import { verifyPortsMatch } from '../../../lib/util/dev-server'
import { expect } from 'chai'

describe('component testing dev-server', () => {
  describe('verifyPortsMatch', () => {
    it('throws error if baseUrl is not a string', () => {
      expect(() => {
        verifyPortsMatch(null, 8080)
      }).to.throw('baseUrl is not set')
    })

    it('creates PortMismatch error in the case baseUrl cannot be parsed', () => {
      expect(() => {
        verifyPortsMatch('foobar', 8080)
      }).to.throw('unable to parse baseUrl')
    })

    it('rethrows error if PortMismatch error is thrown in the case ports do not match', () => {
      expect(() => {
        verifyPortsMatch('http://localhost:8080', 8081)
      }).to.throw('baseUrl is expecting port 8080 but dev-server is running on port 8081')
    })

    it('returns void if ports match', () => {
      expect(() => {
        verifyPortsMatch('http://localhost:8080', 8080)
      }).not.to.throw()
    })
  })
})
