import '../../spec_helper'

import { expect } from 'chai'
import { Request } from 'express'
import { SocketAllowed } from '../../../lib/util/socket_allowed'
import { EventEmitter } from 'events'
import { Socket } from 'net'
import { DocumentDomainInjection, RemoteStates } from '@packages/network-tools'

const SERVER_PORT = 4455

const createRemoteStates = (injectDocumentDomain = false) => {
  return new RemoteStates(() => ({ server: SERVER_PORT, fileServer: 4456 }), DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain, testingType: 'e2e' }))
}

describe('lib/util/socket_allowed', function () {
  let sw: SocketAllowed

  beforeEach(() => {
    sw = new SocketAllowed(createRemoteStates(), () => SERVER_PORT)
  })

  context('#add', () => {
    it('adds localPort to allowed list and removes it when closed', () => {
      const socket = new EventEmitter as Socket

      // @ts-ignore readonly
      socket.localPort = 12345

      const req = {
        socket: {
          remotePort: socket.localPort,
          remoteAddress: '127.0.0.1',
        },
      } as Request

      expect(sw.allowedLocalPorts).to.deep.eq([])
      expect(sw.isRequestAllowed(req)).to.be.false

      sw.add(socket)
      expect(sw.allowedLocalPorts).to.deep.eq([socket.localPort])
      expect(sw.isRequestAllowed(req)).to.be.true

      socket.emit('close')
      expect(sw.allowedLocalPorts).to.deep.eq([])
      expect(sw.isRequestAllowed(req)).to.be.false
    })
  })

  context('#isRequestFromTrustedOrigin', () => {
    const reqWithOrigin = (origin?: string) => ({ headers: origin === undefined ? {} : { origin } }) as Request

    it('allows a trusted origin', () => {
      expect(sw.isRequestFromTrustedOrigin(reqWithOrigin(`http://localhost:${SERVER_PORT}`))).to.be.true
    })

    it('rejects other, opaque, and missing origins', () => {
      for (const origin of ['https://other.example.com', 'http://localhost:4000', 'null', undefined]) {
        expect(sw.isRequestFromTrustedOrigin(reqWithOrigin(origin)), String(origin)).to.be.false
      }
    })

    it('allows a moz-extension origin only when asked to', () => {
      const req = reqWithOrigin('moz-extension://3f1c2b2e-0000-4000-8000-000000000000')

      expect(sw.isRequestFromTrustedOrigin(req)).to.be.false
      expect(sw.isRequestFromTrustedOrigin(req, { allowExtension: true })).to.be.true
    })
  })

  context('#isTrustedOrigin', () => {
    it('trusts the server\'s own origin before a primary is set', () => {
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).to.be.true
      expect(sw.isTrustedOrigin('http://localhost:3500')).to.be.false
    })

    it('trusts only the exact primary origin', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://www.foobar.com:3500/index.html')

      expect(sw.isTrustedOrigin('http://www.foobar.com:3500')).to.be.true
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).to.be.true
      expect(sw.isTrustedOrigin('http://app.foobar.com:3500')).to.be.false
      expect(sw.isTrustedOrigin('https://www.foobar.com:3500')).to.be.false
      expect(sw.isTrustedOrigin('http://www.foobar.com:3501')).to.be.false
    })

    it('trusts the primary\'s superdomain when injecting document.domain', () => {
      const remoteStates = createRemoteStates(true)

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://www.foobar.com:3500/index.html')

      expect(sw.isTrustedOrigin('http://app.foobar.com:3500')).to.be.true
      expect(sw.isTrustedOrigin('http://www.barbaz.com:3500')).to.be.false
    })

    it('follows the primary as it moves', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://localhost:3500')
      expect(sw.isTrustedOrigin('http://localhost:3500')).to.be.true

      remoteStates.set('http://www.foobar.com:3500')
      expect(sw.isTrustedOrigin('http://localhost:3500')).to.be.false
      expect(sw.isTrustedOrigin('http://www.foobar.com:3500')).to.be.true
    })

    it('judges only by the primary while the server has no port', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => undefined)
      remoteStates.set('http://localhost:3500')

      expect(sw.isTrustedOrigin('http://localhost:3500')).to.be.true
      expect(sw.isTrustedOrigin('http://localhost:undefined')).to.be.false
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).to.be.false
    })

    it('trusts the server\'s own origin on a default port', () => {
      sw = new SocketAllowed(createRemoteStates(), () => 80)

      expect(sw.isTrustedOrigin('http://localhost')).to.be.true
    })

    it('rejects non-http origins', () => {
      for (const origin of ['null', '', 'moz-extension://abc', 'chrome-extension://abc', 'file://', 'about:blank']) {
        expect(sw.isTrustedOrigin(origin), origin).to.be.false
      }
    })
  })
})
