import * as socketIoParser from 'socket.io-parser'
// @ts-ignore
import * as engineParser from 'engine.io-parser'

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
      const decoder = new socketIoParser.Decoder()

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
