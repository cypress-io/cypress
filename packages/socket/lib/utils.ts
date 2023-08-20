import * as socketIoParser from 'socket.io-parser'
// @ts-ignore
import * as engineParser from 'engine.io-parser'

export const encode = (data: any, namespace: string) => {
  return new Promise((resolve) => {
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
  })
}

export const decode = (data: any) => {
  return new Promise((resolve) => {
    const decoded = engineParser.decodePayload(data)
    const decoder = new socketIoParser.Decoder()

    decoder.on('decoded', (packet: any) => {
      decoder.destroy()
      resolve(packet.data)
    })

    decoded.forEach((packet: any) => {
      decoder.add(packet.data)
    })
  })
}
