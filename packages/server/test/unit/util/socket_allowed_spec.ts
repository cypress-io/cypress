import '../../spec_helper'

import { expect } from 'chai'
import { Request } from 'express'
import { SocketAllowed } from '../../../lib/util/socket_allowed'
import { EventEmitter } from 'events'
import { Socket } from 'net'

describe('lib/util/socket_allowed', function () {
  let sw: SocketAllowed

  beforeEach(() => {
    sw = new SocketAllowed()
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
})
