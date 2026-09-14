const { expect } = require('../../spec_helper')

import { toNetworkError } from '../../../lib/browsers/cdp-protocol/cdp-network-error'

describe('lib/browsers/cdp-protocol/cdp-network-error', () => {
  context('reasons with a Node equivalent produce the error the MITM path would have', () => {
    // On the MITM path Cypress makes the upstream request itself, so cy.intercept
    // and the driver's error classification see Node's own connection errors.
    // These mappings keep message and `code` transport-independent.

    it('ConnectionRefused → connect ECONNREFUSED host:port', () => {
      const err = toNetworkError('http://127.0.0.1:3333/should-err', 'ConnectionRefused')

      expect(err.message).to.equal('connect ECONNREFUSED 127.0.0.1:3333')
      expect(err).to.have.property('code', 'ECONNREFUSED')
    })

    it('ConnectionReset → read ECONNRESET, with no peer address', () => {
      // a reset happens mid-stream, after connect — Node reports the syscall
      // that failed (read) and no address
      const err = toNetworkError('http://localhost:3500/reset', 'ConnectionReset')

      expect(err.message).to.equal('read ECONNRESET')
      expect(err).to.have.property('code', 'ECONNRESET')
    })

    it('ConnectionClosed → read ECONNRESET, matching how Node surfaces an early close', () => {
      const err = toNetworkError('http://localhost:3500/closed', 'ConnectionClosed')

      expect(err.message).to.equal('read ECONNRESET')
      expect(err).to.have.property('code', 'ECONNRESET')
    })

    it('ConnectionAborted → connect ECONNABORTED host:port', () => {
      const err = toNetworkError('http://localhost:3500/aborted', 'ConnectionAborted')

      expect(err.message).to.equal('connect ECONNABORTED localhost:3500')
      expect(err).to.have.property('code', 'ECONNABORTED')
    })

    it('TimedOut → connect ETIMEDOUT host:port, which the driver classifies as a response timeout', () => {
      // network-error.ts in the driver selects the responseTimeout message off
      // ETIMEDOUT/ESOCKETTIMEDOUT — this mapping is what keeps that working
      // when the browser, not Node, owns the connection
      const err = toNetworkError('http://localhost:3500/slow', 'TimedOut')

      expect(err.message).to.equal('connect ETIMEDOUT localhost:3500')
      expect(err).to.have.property('code', 'ETIMEDOUT')
    })

    it('NameNotResolved → getaddrinfo ENOTFOUND host, with no port', () => {
      // DNS failures name only the host — Node never got far enough to use a port
      const err = toNetworkError('http://no.such.host.invalid:3500/x', 'NameNotResolved')

      expect(err.message).to.equal('getaddrinfo ENOTFOUND no.such.host.invalid')
      expect(err).to.have.property('code', 'ENOTFOUND')
    })

    it('AddressUnreachable → connect EHOSTUNREACH host:port', () => {
      const err = toNetworkError('http://10.255.255.1:3500/x', 'AddressUnreachable')

      expect(err.message).to.equal('connect EHOSTUNREACH 10.255.255.1:3500')
      expect(err).to.have.property('code', 'EHOSTUNREACH')
    })

    it('InternetDisconnected → connect ENETUNREACH host:port', () => {
      const err = toNetworkError('http://example.com:8080/x', 'InternetDisconnected')

      expect(err.message).to.equal('connect ENETUNREACH example.com:8080')
      expect(err).to.have.property('code', 'ENETUNREACH')
    })
  })

  context('peer address formatting matches Node', () => {
    it('fills the default port for https urls', () => {
      const err = toNetworkError('https://example.com/x', 'ConnectionRefused')

      expect(err.message).to.equal('connect ECONNREFUSED example.com:443')
    })

    it('fills the default port for http urls', () => {
      const err = toNetworkError('http://example.com/x', 'ConnectionRefused')

      expect(err.message).to.equal('connect ECONNREFUSED example.com:80')
    })

    it('renders IPv6 literals unbracketed, as Node does', () => {
      const err = toNetworkError('http://[::1]:3333/x', 'ConnectionRefused')

      expect(err.message).to.equal('connect ECONNREFUSED ::1:3333')
    })

    it('omits the address when the url cannot be parsed', () => {
      const err = toNetworkError('not-a-url', 'ConnectionRefused')

      expect(err.message).to.equal('connect ECONNREFUSED')
      expect(err).to.have.property('code', 'ECONNREFUSED')
    })
  })

  context('reasons with no single Node equivalent stay self-describing', () => {
    // Inventing a Node code for these would misreport what the browser saw —
    // e.g. `BlockedByClient` is not a connection failure at all.
    const unmappedReasons = ['Failed', 'Aborted', 'AccessDenied', 'BlockedByClient', 'BlockedByResponse', 'ConnectionFailed'] as const

    unmappedReasons.forEach((reason) => {
      it(`${reason} → descriptive CDP message with no error code`, () => {
        const err = toNetworkError('http://localhost:3500/x', reason)

        expect(err.message).to.equal(`CDP Fetch response failed for http://localhost:3500/x: ${reason}`)
        expect(err).not.to.have.property('code')
      })
    })
  })
})
