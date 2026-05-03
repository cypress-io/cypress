import buffer from 'buffer'
import type http from 'http'
import { Server as SocketIOBaseServer, ServerOptions } from 'socket.io'
import * as socketIoParser from 'socket.io-parser'

// socket.io-parser 4.2.x defaults the Decoder's maxAttachments to 10 as part of
// the GHSA-677m-j7p3-52f9 / CVE-2026-33151 DoS fix. Cypress's driver↔server
// channel is between two trusted local processes and routinely encodes payloads
// (e.g. cy.request responses) with more than 10 binary fields, so the cap
// produces false-positive 'too many attachments' errors. Lift the cap only for
// this Server instance — socket.io-parser's library default stays untouched for
// any other consumer.
class UnlimitedAttachmentsDecoder extends socketIoParser.Decoder {
  constructor (opts?: any) {
    super({ ...opts, maxAttachments: Infinity })
  }
}

const cypressParser = {
  ...socketIoParser,
  Decoder: UnlimitedAttachmentsDecoder,
}

// TODO: this will need to be updated to use an ESM version of the package
const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

export class SocketIOServer extends SocketIOBaseServer {
  constructor (srv: http.Server, opts?: Partial<ServerOptions>) {
    opts = opts ?? {}

    // the maxHttpBufferSize is used to limit the message size sent over
    // the socket. Small values can be used to mitigate exposure to
    // denial of service attacks; the default as of v3.0 is 1MB.
    // because our server is local, we do not need to arbitrarily limit
    // the message size and can use the theoretical maximum value.
    opts.maxHttpBufferSize = opts.maxHttpBufferSize ?? buffer.constants.MAX_LENGTH

    opts.parser = opts.parser ?? cypressParser

    super(srv, opts)
  }
}

export const getPathToClientSource = () => {
  return clientSource
}

export const getClientVersion = () => {
  return version
}
