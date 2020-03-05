import '../../spec_helper'

import { expect } from 'chai'
import { Request } from 'express'
import { SocketWhitelist } from '../../../lib/util/socket_whitelist'
import { EventEmitter } from 'events'
import { Socket } from 'net'

describe('lib/util/socket_whitelist', function () {
  let sw: SocketWhitelist

  beforeEach(() => {
    sw = new SocketWhitelist()
  })

  context('#add', () => {
    it('adds localPort to whitelist and removes it when closed', () => {
      const socket = new EventEmitter as Socket

      // @ts-ignore readonly
      socket.localPort = 12345

      const req = {
        socket: {
          remotePort: socket.localPort,
          remoteAddress: '127.0.0.1',
        },
      } as Request

      expect(sw.whitelistedLocalPorts).to.deep.eq([])
      expect(sw.isRequestWhitelisted(req)).to.be.false

      sw.add(socket)
      expect(sw.whitelistedLocalPorts).to.deep.eq([socket.localPort])
      expect(sw.isRequestWhitelisted(req)).to.be.true

      socket.emit('close')
      expect(sw.whitelistedLocalPorts).to.deep.eq([])
      expect(sw.isRequestWhitelisted(req)).to.be.false
    })
  })
})
