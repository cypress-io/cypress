import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Readable } from 'stream'
import { describe, expect, it } from 'vitest'
import { HttpResponseCodec } from '../../../lib/adapters/http-response-codec'

async function readStream (stream: Readable): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString()
}

describe('HttpResponseCodec', () => {
  it('wraps an origin response without replacing its body stream', async () => {
    const incomingRes = new IncomingMessage(new Socket)
    const bodyStream = Readable.from(['origin'])

    incomingRes.statusCode = 204
    incomingRes.statusMessage = 'No Content'
    incomingRes.headers = { 'x-origin': '1' }

    const response = HttpResponseCodec.fromOrigin(incomingRes, bodyStream)

    expect(response.statusCode).to.equal(204)
    expect(response.statusMessage).to.equal('No Content')
    expect(response.headers).to.deep.equal({ 'x-origin': '1' })
    expect(await response.stream!()).to.equal(bodyStream)
  })

  it('streams a replacement body when one is set on the neutral response', async () => {
    const incomingRes = new IncomingMessage(new Socket)
    const bodyStream = Readable.from(['origin'])
    const response = HttpResponseCodec.fromOrigin(incomingRes, bodyStream)

    response.body = 'replacement'

    expect(await readStream(await response.stream!())).to.equal('replacement')
  })

  it('encodes a neutral response as a proxy response pair', async () => {
    const { incomingRes, bodyStream } = await HttpResponseCodec.toProxyResponse({
      statusCode: 201,
      statusMessage: 'Created',
      headers: {},
      body: '<html><body>created</body></html>',
    })

    expect(incomingRes.statusCode).to.equal(201)
    expect(incomingRes.statusMessage).to.equal('Created')
    expect(incomingRes.headers).to.deep.equal({ 'content-type': 'text/html' })
    expect(await readStream(bodyStream)).to.equal('<html><body>created</body></html>')
  })
})
