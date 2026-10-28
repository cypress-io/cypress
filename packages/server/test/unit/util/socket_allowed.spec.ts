import { beforeEach, describe, expect, it } from 'vitest'
import type { Request } from 'express'
import { SocketAllowed } from '../../../lib/util/socket_allowed'
import { DocumentDomainInjection, RemoteStates } from '@packages/network-tools'
import { EventEmitter } from 'events'
import type { Socket } from 'net'

describe('lib/util/socket_allowed', function () {
  let sw: SocketAllowed

  beforeEach(() => {
    sw = new SocketAllowed()
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
    const primary = 'http://localhost:3000'
    const remoteStates = {
      hasPrimary: () => true,
      isPrimarySuperDomainOrigin: (url: string) => url === primary,
    }
    const reqWithOrigin = (origin?: string) => ({ headers: origin === undefined ? {} : { origin } }) as Request

    beforeEach(() => {
      sw = new SocketAllowed(remoteStates)
    })

    it('allows the primary origin', () => {
      expect(sw.isRequestFromTrustedOrigin(reqWithOrigin(primary))).toBe(true)
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

    it('allows the server\'s own localhost origin, which component testing serves the runner from', () => {
      const req = (origin: string) => ({ headers: { origin }, socket: { localPort: 4455 } }) as unknown as Request

      for (const origin of ['http://localhost:4455', 'http://127.0.0.1:4455']) {
        expect(sw.isRequestFromTrustedOrigin(req(origin)), origin).toBe(true)
      }

      for (const origin of ['http://localhost:4456', 'https://localhost:4455', 'http://other.example.com:4455']) {
        expect(sw.isRequestFromTrustedOrigin(req(origin)), origin).toBe(false)
      }
    })

    it('rejects everything but the server\'s own origin before a primary remote state exists', () => {
      sw = new SocketAllowed({ ...remoteStates, hasPrimary: () => false })

      expect(sw.isRequestFromTrustedOrigin(reqWithOrigin(primary))).toBe(false)
      expect(sw.isRequestFromTrustedOrigin({ headers: { origin: 'http://localhost:4455' }, socket: { localPort: 4455 } } as unknown as Request)).toBe(true)
    })

    it('rejects an origin the remote states cannot parse', () => {
      sw = new SocketAllowed({ ...remoteStates, isPrimarySuperDomainOrigin: () => {
        throw new TypeError('Invalid URL')
      } })

      expect(sw.isRequestFromTrustedOrigin(reqWithOrigin('not a url'))).toBe(false)
    })
  })

  describe('#isTrustedOrigin with real remote states', () => {
    const makeSocketAllowed = (injectDocumentDomain: boolean) => {
      const remoteStates = new RemoteStates(() => ({ server: 4455 }), DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain, testingType: 'e2e' }))

      remoteStates.set('http://app.example.com:3000')

      return { remoteStates, socketAllowed: new SocketAllowed(remoteStates) }
    }

    it('requires an exact origin match by default', () => {
      sw = makeSocketAllowed(false).socketAllowed

      expect(sw.isTrustedOrigin('http://app.example.com:3000')).toBe(true)
      expect(sw.isTrustedOrigin('http://www.example.com:3000')).toBe(false)
      expect(sw.isTrustedOrigin('http://example.com:3000')).toBe(false)
      expect(sw.isTrustedOrigin('http://app.example.com:4000')).toBe(false)
      expect(sw.isTrustedOrigin('https://app.example.com:3000')).toBe(false)
    })

    it('matches by superdomain with injectDocumentDomain', () => {
      sw = makeSocketAllowed(true).socketAllowed

      expect(sw.isTrustedOrigin('http://app.example.com:3000')).toBe(true)
      expect(sw.isTrustedOrigin('http://www.example.com:3000')).toBe(true)
      expect(sw.isTrustedOrigin('http://example.com:3000')).toBe(true)
      expect(sw.isTrustedOrigin('http://app.example.com:4000')).toBe(false)
      expect(sw.isTrustedOrigin('https://app.example.com:3000')).toBe(false)
      expect(sw.isTrustedOrigin('http://app.other.com:3000')).toBe(false)
    })

    it('follows the primary as it changes', () => {
      const { remoteStates, socketAllowed } = makeSocketAllowed(false)

      sw = socketAllowed
      remoteStates.set('https://next.example.org')

      expect(sw.isTrustedOrigin('https://next.example.org')).toBe(true)
      expect(sw.isTrustedOrigin('http://app.example.com:3000')).toBe(false)
    })
  })
})
