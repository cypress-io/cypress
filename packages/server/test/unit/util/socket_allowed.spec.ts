import { beforeEach, describe, expect, it } from 'vitest'
import type { Request } from 'express'
import { SocketAllowed } from '../../../lib/util/socket_allowed'
import { EventEmitter } from 'events'
import type { Socket } from 'net'
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

  describe('#add', () => {
    it('adds localPort to allowed list and removes it when closed', () => {
      const socket = new EventEmitter as Socket

      // @ts-expect-error - localPort is readonly
      socket.localPort = 12345

      const req = {
        socket: {
          remotePort: socket.localPort,
          remoteAddress: '127.0.0.1',
        },
      } as Request

      expect(sw.allowedLocalPorts).toStrictEqual([])
      expect(sw.isRequestAllowed(req)).toBe(false)

      sw.add(socket)
      expect(sw.allowedLocalPorts).toStrictEqual([socket.localPort])
      expect(sw.isRequestAllowed(req)).toBe(true)

      socket.emit('close')
      expect(sw.allowedLocalPorts).toStrictEqual([])
      expect(sw.isRequestAllowed(req)).toBe(false)
    })
  })

  describe('#isRequestFromTrustedOrigin', () => {
    const reqWithOrigin = (origin?: string) => ({ headers: origin === undefined ? {} : { origin } }) as Request

    it('allows a trusted origin', () => {
      expect(sw.isRequestFromTrustedOrigin(reqWithOrigin(`http://localhost:${SERVER_PORT}`))).toBe(true)
    })

    it('rejects other, opaque, and missing origins', () => {
      for (const origin of ['https://other.example.com', 'http://localhost:4000', 'null', undefined]) {
        expect(sw.isRequestFromTrustedOrigin(reqWithOrigin(origin)), String(origin)).toBe(false)
      }
    })

    it('allows a moz-extension origin only when asked to', () => {
      const req = reqWithOrigin('moz-extension://3f1c2b2e-0000-4000-8000-000000000000')

      expect(sw.isRequestFromTrustedOrigin(req)).toBe(false)
      expect(sw.isRequestFromTrustedOrigin(req, { allowExtension: true })).toBe(true)
    })
  })

  describe('#isTrustedOrigin', () => {
    it('trusts the server\'s own origin before a primary is set', () => {
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).toBe(true)
      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(false)
    })

    it('trusts only the exact primary origin', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://www.foobar.com:3500/index.html')

      expect(sw.isTrustedOrigin('http://www.foobar.com:3500')).toBe(true)
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).toBe(true)
      expect(sw.isTrustedOrigin('http://app.foobar.com:3500')).toBe(false)
      expect(sw.isTrustedOrigin('https://www.foobar.com:3500')).toBe(false)
      expect(sw.isTrustedOrigin('http://www.foobar.com:3501')).toBe(false)
    })

    it('trusts the primary\'s superdomain when injecting document.domain', () => {
      const remoteStates = createRemoteStates(true)

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://www.foobar.com:3500/index.html')

      expect(sw.isTrustedOrigin('http://app.foobar.com:3500')).toBe(true)
      expect(sw.isTrustedOrigin('http://www.barbaz.com:3500')).toBe(false)
    })

    it('follows the primary as it moves', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => SERVER_PORT)
      remoteStates.set('http://localhost:3500')
      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(true)

      remoteStates.set('http://www.foobar.com:3500')
      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(false)
      expect(sw.isTrustedOrigin('http://www.foobar.com:3500')).toBe(true)
    })

    it('judges only by the primary while the server has no port', () => {
      const remoteStates = createRemoteStates()

      sw = new SocketAllowed(remoteStates, () => undefined)
      remoteStates.set('http://localhost:3500')

      expect(sw.isTrustedOrigin('http://localhost:3500')).toBe(true)
      expect(sw.isTrustedOrigin('http://localhost:undefined')).toBe(false)
      expect(sw.isTrustedOrigin(`http://localhost:${SERVER_PORT}`)).toBe(false)
    })

    it('trusts the server\'s own origin on a default port', () => {
      sw = new SocketAllowed(createRemoteStates(), () => 80)

      expect(sw.isTrustedOrigin('http://localhost')).toBe(true)
    })

    it('rejects non-http origins', () => {
      for (const origin of ['null', '', 'moz-extension://abc', 'chrome-extension://abc', 'file://', 'about:blank']) {
        expect(sw.isTrustedOrigin(origin), origin).toBe(false)
      }
    })
  })
})
