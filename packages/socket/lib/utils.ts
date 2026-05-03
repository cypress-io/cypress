import * as socketIoParser from 'socket.io-parser'
// @ts-ignore
import * as engineParser from 'engine.io-parser'

// socket.io-parser 4.2.x defaults the Decoder's maxAttachments to 10 as part of
// the GHSA-677m-j7p3-52f9 / CVE-2026-33151 DoS fix. Cypress's driver↔server
// channel is between two trusted local processes and routinely encodes payloads
// (e.g. cy.request responses) with more than 10 binary fields, so the cap
// produces false-positive 'too many attachments' errors. Lift the cap only for
// these Cypress-owned Decoders — socket.io-parser's library default stays
// untouched for any other consumer of the package.
class UnlimitedAttachmentsDecoder extends socketIoParser.Decoder {
  constructor (opts?: any) {
    super({ ...opts, maxAttachments: Infinity })
  }
}

// Re-export-shape suitable for the `parser` option on socket.io's Server and
// socket.io-client's Manager: includes Encoder/PacketType/protocol from
// socket.io-parser plus the unlimited-attachments Decoder subclass.
export const cypressParser = {
  ...socketIoParser,
  Decoder: UnlimitedAttachmentsDecoder,
}

export const encode = (data: any, namespace: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const encoder = new socketIoParser.Encoder()
      const socketIoEncodedData = encoder.encode({
        type: socketIoParser.PacketType.EVENT,
        data,
        nsp: namespace,
      })

      engineParser.encodePayload(socketIoEncodedData.map((item) => {
        return {
          type: 'message',
          data: item,
        }
      }), (encoded: any) => {
        resolve(encoded)
      })
    } catch (err) {
      reject(err)
    }
  })
}

export const decode = (data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const decoded = engineParser.decodePayload(data)
      const decoder = new cypressParser.Decoder()

      decoder.on('decoded', (packet: any) => {
        decoder.destroy()
        resolve(packet.data)
      })

      decoded.forEach((packet: any) => {
        decoder.add(packet.data)
      })
    } catch (error) {
      reject(error)
    }
  })
}
